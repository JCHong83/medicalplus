import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabaseClient";
import { useRouter } from "expo-router";
import { useRole } from "../../src/context/RoleContext";
import * as SecureStore from "expo-secure-store";

export default function ProfilePage() {
  const router = useRouter();
  const { activeRole, setActiveRoleAndWait, resetRole } = useRole();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"Patient" | "Doctor" | "">("");
  const [isSwitching, setIsSwitching] = useState(false);

  // Fetch user & DB role once
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // fetch from profiles table
      const { data: profileRow, error } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();


      if (!error && profileRow) {
        setRole(profileRow.role === "doctor" ? "Doctor" : "Patient");
      } else {
        // fallback to user_metadata
        const userRole = user.user_metadata?.role || "Patient";
        setRole(userRole === "doctor" ? "Doctor" : "Patient");
      }
    })();
  }, []);

  // Reset Password
  const handlePasswordReset = async () => {
    if(!user?.email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    } 

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: "medicalplus://(auth)/reset",
    });

    if (error) {
      Alert.alert("Error", error.message);
      console.error("Password reset error:", error);
      return;
    }

    Alert.alert(
      "Password Reset",
      "Check your inbox. We've sent you a link to reset your password."
    );
  };

  // Logout: clear session + stored role
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await resetRole();
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Toggle doctor/patient mode with guaranteed persistence
  const handleSwitchRole = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      const newRole = activeRole === "doctor" ? "patient" : "doctor";
      await setActiveRoleAndWait(newRole);

      // navigate to correct root
      if (newRole === "doctor") {
        router.replace("/(protected)/doctor/(tabs)");
      } else {
        router.replace("/(protected)/patient/(tabs)/profile");
      }
    } catch (err) {
      console.error("Error switching role:", err);
      Alert.alert("Error", "Unable to switch mode. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const fullName = user.user_metadata?.full_name || "Your Name";
  const avatarUrl = 
    user.user_metadata?.avatar_url ||
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const email = user.email;

  return (

    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Top section / header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>

          <Text style={styles.nameText}>{fullName}</Text>
          <View style={styles.roleChip}>
            <Ionicons
              name={role === "Doctor" ? "medkit-outline" : "person-outline"}
              size={14}
              color="#0077b6"
            />
            <Text style={styles.roleChipText}>
              {role} ({activeRole === "doctor" ? "Doctor Mode" : "Patient Mode"})
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Account Info</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="mail-outline" size={18} color="#0077b6" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="id-card-outline" size={18} color="#0077b6" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoTitle}>Registered Role</Text>
              <Text style={styles.infoValue}>{role}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>

          <TouchableOpacity style={[styles.primaryButton, { marginBottom: 12 }]} onPress={() => router.push("/(common)/edit-profile")}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handlePasswordReset}>
            <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Reset Password</Text>
          </TouchableOpacity>

          {/* Switch Role with redirect */}
          {role === "Doctor" && (
            <TouchableOpacity
              disabled={isSwitching}
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: "#03045e",
                  opacity: isSwitching ? 0.6 : 1,
                },
              ]}
              onPress={handleSwitchRole}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {isSwitching
                  ? "Switching..."
                  : `Switch to ${activeRole === "doctor" ? "Patient" : "Doctor"} Mode`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#d00000" />
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>  
  );
}


const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f6f8fa",
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  scrollBody: {
    paddingBottom: 60,
  },

  // Loading State
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#555",
    fontSize: 16,
  },

  // Header Card
  headerCard: {
    backgroundColor: "#e6f2f9",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,119,182,0.15)",
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#0077b6",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#03045e",
    textAlign: "center",
  },
  roleChip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderColor: "#0077b6",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    marginTop: 8,
  },
  roleChipText: {
    color: "#0077b6",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },

  // Info Section
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#03045e",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f2f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTextCol: {
    flexShrink: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#03045e",
  },
  infoValue: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },

  // Actions
  actionSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0077b6",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d00000",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#d00000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Doctor Shortcut Section
  extraSection: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashboardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#03045e",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
  },
  dashboardButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});