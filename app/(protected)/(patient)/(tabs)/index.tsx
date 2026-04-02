import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

export default function PatientDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hello,</Text>
        <Text style={styles.brandText}>Medical+</Text>
      </View>

      {/* AI AGENT HERO CARD */}
      <TouchableOpacity
        style={styles.aiHero}
        onPress={() => router.push("/(protected)/(patient)/(tabs)/ai-assistant")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#0077b6', '#03045e']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.aiContent}>
          <View style={styles.aiIconWrapper}>
            <Ionicons name="sparkles" size={32} color="#fff" />
          </View>
          <View style={styles.aiTextWrapper}>
            <Text style={styles.aiTitle}>AI Medical Assistant</Text>
            <Text style={styles.aiSubtitle}>Describe your symptoms and find the right specialist instantly.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7" />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Manual Search</Text>

      {/* MANUAL BROWSING CARD */}
      <TouchableOpacity
        style={styles.browseCard}
        onPress={() => {
          // This will lead to the list view we are about to build
          router.push("/(protected)/(patient)/browse-doctors");
        }}
      >
        <View style={styles.browseIconCircle}>
          <Ionicons name="search" size={24} color="#0077b6" />
        </View>
        <View style={styles.browseTextWrapper}>
          <Text style={styles.browseTitle}>Find a Doctor</Text>
          <Text style={styles.browseSubtitle}>Browse all registered and local medical facilities.</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#ccc" />
      </TouchableOpacity>

      {/* INFO CARDS (Optional logic placeholders) */}
      <View style={styles.row}>
        <View style={[styles.infoCard, { backgroundColor: '#e6f2f9' }]}>
          <Ionicons name="calendar-outline" size={24} color="#0077b6" />
          <Text style={styles.infoCardText}>My Appointments</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: '#f0f0f0' }]}>
          <Ionicons name="document-text-outline" size={24} color="#333" />
          <Text style={styles.infoCardText}>Health Records</Text>
        </View>
      </View>
    </ScrollView>
  );
}


// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: "#666",
  },
  brandText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#03045e",
  },
  // AI HERO
  aiHero: {
    backgroundColor: "#0077b6",
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#0077b6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  aiContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aiTextWrapper: {
    flex: 1,
  },
  aiTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  aiSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  // SECTION TITLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  // BROWSE CARD
  browseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  browseIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f2f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  browseTextWrapper: {
    flex: 1,
  },
  browseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#03045e",
  },
  browseSubtitle: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  // INFO ROW
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCard: {
    width: "48%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  infoCardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  }
});