import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useRole } from "../../src/context/RoleContext";

export default function ProtectedLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { user, loading: authLoading } = useAuth();
  const {
    activeRole,
    isLoading: roleLoading,
    hasSynced,
    syncRoleWithUser,
  } = useRole();

  // CRITICAL : We stay in a loading state if
  // 1. Auth is still initializing
  // 2. RoleContext is internally loading
  // 3. We have a user, but we haven't verified their DB role yet (hasSynced is false)
  const isWaitingForSync = user && !hasSynced;
  const showLoader = authLoading || roleLoading || isWaitingForSync;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (!hasSynced && !roleLoading) {
      console.log("[ProtectedLayout] User detected but not synced. Starting sync...");
      syncRoleWithUser();
      return;
    }

    // Don't perform any routing logic while we are still loading/syncing
    if (showLoader) return;

    // Identify the current role segment (doctor or patient)
    const currentRoleSegment = segments.find(
      (s) => s === "doctor" || s === "patient"
    );

    // Check if they are at the root of the protected group
    const isAtProtectedRoot = segments.length === 1 && segments[0] === "(protected)";

    // THE GUARD: Redirect if
    // They are at the root (just logged in)
    // OR they are in a folder that doesn't match their activeRole
    if (isAtProtectedRoot || (currentRoleSegment && currentRoleSegment !== activeRole)) {
      console.log(`[ProtectedLayout] Guard triggering. Sending to /${activeRole}`);
      router.replace(`/${activeRole}`);
    }

    // Let RoleContext handle the authoritative DR check to avoid race conditions.

  }, [authLoading, roleLoading, hasSynced, user, activeRole, segments ])

  // Global loading fallback
  if (showLoader || !activeRole) {
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
  if (!currentRoleSegment || currentRoleSegment !== activeRole) {
    return null;
  }

  console.log(`[ProtectedLayout] Rendering Slot for: ${activeRole}`);
  return <Slot />;
}