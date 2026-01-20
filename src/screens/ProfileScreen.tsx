import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../api/supabaseClient";
import { useRole } from "../context/RoleContext";
import { useRouter } from "expo-router";


export default function ProfileScreen() {
  const { activeRole, setActiveRoleAndWait } = useRole();
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

    const { error } = await supabase.auth.resetPasswordForEmail(user.emal, {
      redirectTo: "medicalplus://auth/reset",
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert(
      "Password Reset",
      "Check your inbox. We've sent you a link to reset your password."
    );
  };


  const handleSwitchRole = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      const nextRole = activeRole === "doctor" ? "patient" : "doctor";
      await setActiveRoleAndWait(nextRole);

    } catch (err) {
      Alert.alert("Error", "Unable to switch mode. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const fullName = user.user_metadata?.full_name || "Your Name";
  const avatarUrl = user.user_metadata?.avatar_url || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const email = user.email;

  // REUSABLE COMPONENTS

  // InfoRow
  interface InfoRowProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
  }

  function InfoRow({ icon, label, value }: InfoRowProps) {
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

  // Primary Button
  interface PrimaryButtonProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
    disabled?: boolean;
    dark?: boolean; // optional dark variation
  }

  function PrimaryButton({ icon, label, onPress, disabled, dark }: PrimaryButtonProps) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.primaryButton,
          dark && { backgroundColor: "#03045e" },
          disabled && { opacity: 0.6 },
        ]}
      >
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Secondary Button
  interface SecondaryButtonProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }

  function SecondaryButton({ icon, label, onPress, disabled }: SecondaryButtonProps) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.secondaryButton,
          disabled && { opacity: 0.6 },
        ]}
      >
        <Ionicons name={icon} size={20} color="#d00000" />
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // The structure

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>

          <Text style={styles.name}>{fullName}</Text>

          <View style={styles.roleBadge}>
            <Ionicons
              name={activeRole === "doctor" ? "medkit-outline" : "person-outline"}
              size={14}
              color="#0077b6"
            />
            <Text style={styles.roleText}>
              {activeRole === "doctor" ? "Doctor" : "Patient"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          
          <InfoRow icon="mail-outline" label="Email" value={email} />
          <InfoRow icon="id-card-outline" label="Registered Role" value={activeRole === "doctor" ? "Doctor" : "Patient"} />
        </View>

        {/* ACTIONS */}
        <View style={styles.card}>
          <PrimaryButton
            icon="create-outline"
            label="Edit Profile"
            onPress={() => router.push("/(common)/edit-profile")}
          />

          <PrimaryButton
            icon="lock-closed-outline"
            label="Reset Password"
            onPress={handlePasswordReset}
          />

          <PrimaryButton
            icon="swap-horizontal-outline"
            label={
              isSwitching
                ? "Switching..."
                : `switch to ${activeRole === "doctor" ? "Patient" : "Doctor"}`
            }
            disabled={isSwitching}
            dark
            onPress={handleSwitchRole}
          />

          <SecondaryButton
            icon="log-out-outline"
            label="Logout"
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