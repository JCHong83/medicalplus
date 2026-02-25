import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../api/supabase";
import { useRole } from "../../context/RoleContext";
import { useRouter, Href } from "expo-router";

export default function ProfileView() {
  const { activeRole, dbRole, setActiveRole, resetRole, hasSynced } = useRole();
  const [user, setUser] = useState<any>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: "medicalplus://auth/reset",
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Password Reset", "Check your inbox for the reset link.");
  };

  const handleSwitchRole = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      const nextRole = activeRole === "doctor" ? "patient" : "doctor";
      await setActiveRole(nextRole);
      // ProtectedLayout handles the redirect automatically
    } catch (err) {
      Alert.alert("Error", "Unable to switch mode.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await resetRole();
    router.replace("/(auth)/login" as Href);
  };

  if (!user || !hasSynced) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const fullName = user.user_metadata?.full_name || "Medical User";
  const avatarUrl = user.user_metadata?.avatar_url || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const email = user.email;

  // INTERNAL COMPONENTS
  function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoIconCircle}>
          <Ionicons name={icon} size={18} color="#0077b6" />
        </View>
        <View style={styles.infoTextCol}>
          <Text style={styles.infoTitle}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  }

  function ActionButton({ icon, label, onPress, disabled, dark, danger }: any) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          danger ? styles.secondaryButton : styles.primaryButton,
          dark && { backgroundColor: "#03045e" },
          disabled && { opacity: 0.6 },
        ]}
      >
        <Ionicons name={icon} size={20} color={danger ? "#d00000" : "#fff"} />
        <Text style={danger ? styles.secondaryButtonText : styles.primaryButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* HEADER: Shows Current View State */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={activeRole === "doctor" ? "medkit-outline" : "person-outline"} size={14} color="#0077b6" />
            <Text style={styles.roleText}>
              {activeRole === "doctor" ? "Doctor Mode" : "Patient Mode"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT INFO: Shows Permanent Database Identity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          <InfoRow icon="mail-outline" label="Email" value={email} />
          <InfoRow 
            icon="id-card-outline" 
            label="Registered Role" 
            value={dbRole === "doctor" ? "Medical Professional" : "Standard Patient"} 
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.card}>
          <ActionButton
            icon="create-outline"
            label="Edit Profile"
            onPress={() => router.push("/(protected)/edit-profile" as Href)}
          />

          <ActionButton
            icon="lock-closed-outline"
            label="Reset Password"
            onPress={handlePasswordReset}
          />

          {/* Logic: Only Doctors can see the Switcher */}
          {dbRole === "doctor" && (
            <ActionButton
              icon="swap-horizontal-outline"
              label={isSwitching ? "Switching..." : `Switch to ${activeRole === "doctor" ? "Patient" : "Doctor"} View`}
              disabled={isSwitching}
              dark
              onPress={handleSwitchRole}
            />
          )}

          <ActionButton
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },

  // HEADER
  header: {
    backgroundColor: "#e6f2f9",
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#0077b6",
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#03045e",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  roleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color:"#0077b6",
  },

  // CARDS
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#03045e",
    marginBottom: 16,
  },

  // INFOROW COMPONENT
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
});