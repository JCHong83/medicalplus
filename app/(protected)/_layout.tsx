import { Slot, useRouter, useSegments, Href } from "expo-router";
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

  const isWaitingForSync = user && !hasSynced;
  const showLoader = authLoading || roleLoading || isWaitingForSync;

  // Helper to determine which "Zone" we are currently in
  const pathSegments = segments as string[];
  const inDoctorZone = pathSegments.some(s => s.includes("doctor"));
  const inPatientZone = pathSegments.some(s => s.includes("patient"));

  useEffect(() => {
    if (authLoading) return;

    // 1. Auth Guard
    if (!user) {
      router.replace("/(auth)/login" as Href);
      return;
    }

    // 2. Sync Guard
    if (!hasSynced && !roleLoading) {
      syncRoleWithUser();
      return;
    }

    // 3. Role/Route Guard
    if (hasSynced && activeRole) {
      console.log("DEBUG SEGMENTS:", pathSegments);

      if (activeRole === "doctor" && !inDoctorZone) {
        console.log("[ProtectedLayout] Moving to Doctor Zone");
        // Use the absolute path to ensure the group is resolved
        router.replace("/(protected)/(doctor)/(tabs)" as Href);
      } 
      else if (activeRole === "patient" && !inPatientZone) {
        console.log("[ProtectedLayout] Moving to Patient Zone");
        // Use the absolute path to ensure the group is resolved
        router.replace("/(protected)/(patient)/(tabs)" as Href);
      }
    }
  }, [authLoading, roleLoading, hasSynced, user, activeRole, segments]);

  // Loading State
  if (showLoader || !activeRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  // Authorization Check - Use the same Zone logic as above
  const isAuthorized = (activeRole === "doctor" && inDoctorZone) || 
                       (activeRole === "patient" && inPatientZone);

  if (!isAuthorized) {
    console.log(`[ProtectedLayout] Blocking render. Role: ${activeRole}, InDoc: ${inDoctorZone}, InPat: ${inPatientZone}`);
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="small" color="#0077b6" />
      </View>
    );
  }

  console.log(`[ProtectedLayout] Rendering Slot for: ${activeRole}`);
  return <Slot />;
}