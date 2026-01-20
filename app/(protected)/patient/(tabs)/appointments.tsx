import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Appointment {
  id: string;
  date: string; // ISO string
  time: string;
  doctorName: string;
  specialization: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  clinicName: string;
  clinicAddress: string;
}

export default function AppointmentPage() {
  const router = useRouter();

  // Dummy Data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "a1",
      date: "2025-10-25",
      time: "09:30",
      doctorName: "Dr. Emily Smith",
      specialization: "Cardiology",
      serviceName: "Heart Checkup",
      servicePrice: 80,
      serviceDuration: 45,
      clinicName: "Downtown Clinic",
      clinicAddress: "123 Main St, Springfield",
    },
    {
      id: "a2",
      date: "2025-10-28",
      time: "14:00",
      doctorName: "Dr. Michael Brown",
      specialization: "Dermatology",
      serviceName: "Skin Consultation",
      servicePrice: 60,
      serviceDuration: 30,
      clinicName: "City Health Center",
      clinicAddress: "456 Park Ave, Springfield",
    },
  ]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setAppointments((prev) => prev.filter((a) => a.id !== id));
          },
        },
      ]
    );
  };

  const handleModify = (appointment: Appointment) => {
    // Navigate to booking page in "edit" mode
    router.push({
      pathname: "/(protected)/patient/booking",
      params: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorName, // This is for now a dummy
        mode: "edit", // this is so booking.tsx can show "Update Appointment"
      },
    });
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>

      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.date} at {item.time}</Text>
        <View style={styles.icons}>
          <TouchableOpacity onPress={() => handleModify(item)} style={{ marginRight: 10 }}>
            <Ionicons name="create-outline" size={22} color="#0077b6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#d00000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Doctor:</Text>
        <Text style={styles.value}>{item.doctorName} ({item.specialization})</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Service:</Text>
        <Text style={styles.value}>{item.serviceName} - ${item.servicePrice} ({item.serviceDuration} min)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Clinic:</Text>
        <Text style={styles.value}>{item.clinicName}, {item.clinicAddress}</Text>
      </View>

    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>

      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>No appointments booked yet.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#03045e",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0077b6",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    marginTop: 4,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    color: "#555",
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
});