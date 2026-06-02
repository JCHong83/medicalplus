import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../../src/api/supabase";
import * as SecureStore from "expo-secure-store";
import { useRole } from "../../../../src/context/RoleContext";

export default function DoctorDashboard() {
  const router = useRouter();
  const { setActiveRole } = useRole();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const managementSections = [
    { name: "My Appointments", icon: "calendar-outline", route: "/(doctor)/appointments" },
    { name: "Clinic Locations", icon: "business-outline", route: "/(doctor)/clinics" },
    { name: "Services & Pricing", icon: "briefcase-outline", route: "/(doctor)/services" },
    { name: "Availability Hours", icon: "time-outline", route: "/(doctor)/availability" },
  ];

  // Switch to patient mode
  const handleSwitchToPatient = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      await setActiveRole("patient");
      router.replace("/(protected)/(patient)/(tabs)");
    } catch (err) {
      console.error("Error switching to patient mode:", err);
      Alert.alert("Error", "Unable to switch to patient mode. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  // Logout Securely
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync("activeRole");
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Practice Manager</Text>
      <Text style={styles.subtitle}>Configure your clinics, services, and schedule.</Text>

      {/* Main Grid */}
      <View style={styles.grid}>
        {managementSections.map((s) => (
          <TouchableOpacity
            key={s.name}
            style={styles.card}
            onPress={() => router.push(s.route as Href)}
          >
            <Ionicons name={s.icon as any} size={28} color="#0077b6" />
            <Text style={styles.cardText}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Account Section */}
      <Text style={styles.sectionHeader}>Account</Text>
      <TouchableOpacity style={styles.cardFull} onPress={() => router.push("/(protected)/(doctor)/(tabs)/profile")}>
        <Ionicons name="person-outline" size={24} color="#555" />
        <Text style={styles.cardFullText}>Edit Professional Profile</Text>
      </TouchableOpacity>

      {/* ... keep Switch and Logout buttons ... */}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container:{ flex: 1, backgroundColor: "#f9fafb", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#03045e", marginBottom: 4 },
  subtitle: { color: "#555", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardText: { marginTop: 10, fontWeight: "600", color: "#03045e" },
  switchButton: {
    marginTop: 40,
    flexDirection: "row",
    backgroundColor: "#0077b6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  logoutButton: {
    marginTop: 20,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderColor: "#d00000",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#d00000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#03045e', marginTop: 24, marginBottom: 12 },
  cardFull: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', gap: 12 },
  cardFullText: { fontSize: 16, color: '#333' },
});