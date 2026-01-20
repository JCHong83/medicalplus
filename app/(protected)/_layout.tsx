import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRole } from "../../src/context/RoleContext";
import { supabase } from "../../src/api/supabaseClient";

export default function ProtectedLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { user, loading: authLoading } = useAuth();
  const {
    activeRole,
    isLoading: roleLoading,
    setActiveRoleAndWait,
  } = useRole();

  useEffect(() => {
    // Wait for auth and role providers to be ready
    if (authLoading || roleLoading) return;

    // If no user, kick to login
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    // Identify where the user is
    const currentRoleSegment = segments.find(
      (s) => s === "doctor" || s === "patient"
    );

    // Check if they are at the "Protected Rppt" (no role segment yet)
    const isAtRoot = segments.length === 1 && segments[0] === "(protected)";

    // THE LOGIC
    // Redirect only if they have no role folder OR are in the WRONG one.
    if (isAtRoot || (currentRoleSegment && currentRoleSegment !== activeRole)) {
      console.log(`[ProtectedLayout] Guard triggering. Sending to /${activeRole}`);
      router.replace(`/${activeRole}`);
    }

    // Let RoleContext handle the authoritative DR check to avoid race conditions.

  }, [authLoading, roleLoading, user, activeRole, segments ])

  // Global loading fallback
  if (authLoading || roleLoading || !activeRole) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  // Safety check to ensure we don't render content until we are in the right folder
  const currentRoleSegment = segments.find((s) => s === "doctor" || s === "patient");
  if (!currentRoleSegment) return null;

  console.log(`[ProtectedLayout] Rendering Slot for: ${activeRole}`);

  return <Slot />;
}