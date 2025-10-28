import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, Slot, useRouter } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { supabase } from "../src/api/supabaseClient"
import { AuthProvider } from '../src/context/AuthContext';


export default function RootLayout() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // no loggen-in user - show login/signup flow
          setCheckingSession(false);
          return;
        }

        // fetch role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role ?? "pazient";

        // delay redirect until layout fully mounted
        setTimeout(() => {
          if (role === "doctor") {
            router.replace("/(doctor)");
          } else if (role === "admin") {
            router.replace("/(admin)");
          } else {
            router.replace("/(patient)");
          }
        }, 0);
      } catch (err) {
        console.error("Error checking user session:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkUser();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        {checkingSession ? (
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
        ) : (
          
            <Stack
              screenOptions={{
                headerShown: false,
                headerTitleAlign: "center",
                headerTintColor: "#03045e",
              }}
            >
              <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
              <Stack.Screen name="(patient)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            </Stack>
        )}
      </AuthProvider>
    </PaperProvider>
  );
}