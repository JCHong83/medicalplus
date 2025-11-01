import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { supabase } from "../src/api/supabaseClient";
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { RoleProvider, useRole } from "../src/context/RoleContext";

function RootNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth(); // use the new global auth hook
  const { activeRole, isLoading: roleLoading, syncRoleWithUser } = useRole();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const handleRouting = async () => {
      // Wait for both auth and role to load
      if (loading || roleLoading) return;

      console.log("DEBUG startup:", {
        user: user?.id,
        activeRole,
        pathname,
      });

      try {
        // --- NO USER : show public routes only ---
        if (!user) {
          const isPublic =
            pathname === "/" || 
            pathname === "/index" || 
            pathname.includes("/login") ||
            pathname.includes("/signup");
  
          if (!isPublic) router.replace("/"); // redirect to landing page
          setCheckingSession(false);
          return;
        }

        // ---USER LOGGED IN: get role ---
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) console.warn("Failed to fetch user role:", error);
        const dbRole = profile?.role ?? "patient";

        // Ensure stored role matches database role
        await syncRoleWithUser();

        const isPublicRoute =
          pathname === "/" || 
          pathname === "/index" || 
          pathname.includes("/login") ||
          pathname.includes("/signup");

          console.log("Redirecting to:", { dbRole, activeRole });

          // --- Redirect logged-in user only from public routes ---
          if (!hasRedirected && isPublicRoute) {
            setHasRedirected(true);
          
            setTimeout(() => {
              if (dbRole === "doctor" && activeRole === "doctor") {
                router.replace("/(doctor)/(tabs)");
              } else {
                router.replace("/(patient)/(tabs)");
              }
            }, 100);
          }
        } catch (err) {
          console.error("Error checking session:", err);
        } finally {
          setCheckingSession(false);
        }
    };
          
        handleRouting();
  }, [user, loading, pathname, hasRedirected, activeRole]);
    

  // --- Global loading spinner ---
  if (loading || roleLoading || checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerTintColor: "#03045e",
      }}
    >
      {/* Public */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* Protected */}
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
      <Stack.Screen name="(common)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RoleProvider>
          <RootNavigator />
        </RoleProvider>
      </AuthProvider>
    </PaperProvider>
  )
}