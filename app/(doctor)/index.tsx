import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorDashboard() {
  const router = useRouter();

  const sections = [
    { name: "Appointments", icon: "calendar-outline", route: "/(doctor)/appointments" },
    { name: "Availability", icon: "time-outline", route: "/(doctor)/availability" },
    { name: "Clinics", icon: "business-outline", route: "/(doctor)/clinics" },
    { name: "Services", icon: "briefcase-outline", route: "/(doctor)/services" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome, Doctor 👋</Text>
      <Text style={styles.subtitle}>Manage your schedule and practice with ease.</Text>

      <View style={styles.grid}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.name}
            style={styles.card}
            onPress={() => router.push( s.route as Href)}
          >
            <Ionicons name={s.icon as any} size={28} color="#0077b6" />
            <Text style={styles.cardText}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
});