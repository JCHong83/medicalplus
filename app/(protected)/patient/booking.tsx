import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, Alert, } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


interface Availability {
  [clinicId: string]: {
    [date: string]: string[]; // array of time slots
  };
}

interface Clinic {
  id: string;
  name: string;
  address: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  clinics: Clinic[];
  services: Service[];
  availability: Availability;
}



// For now we'll mock data; later connect to Supabase
const mockDoctor: Doctor = {
  id: "doc-123",
  name: "Dr. Emily Smith",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  specialization: "Cardiologist",
  clinics: [
    { id: "c1", name: "Downtown Clinic", address: "123 Main St" },
    { id: "c2", name: "City Hospital", address: "45 Center Rd" },
  ],
  services: [
    { id: "s1", name: "Consultation", duration: 30, price: 50 },
    { id: "s2", name: "ECG Test", duration: 45, price: 80 },
    { id: "s3", name: "Follow-up", duration: 20, price: 40 },
  ],
  availability: {
    c1: {
      // mock daily time slots
      "2025-10-21": ["09:00", "09:30", "10:00", "11:00", "15:00"],
    },
    c2: {
      "2025-10-21": ["08:00", "08:30", "09:30", "13:00", "16:00"],
    },
  },
};

export default function bookScreen() {
  const { doctorId, appointmentId, mode } = useLocalSearchParams<{ 
    doctorId?: string;
    appointmentId?: string;
    mode?: string;
  }>(); // id from query string

  const isEditMode = mode === "edit";

  const router = useRouter();

  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("2025-10-21");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");

  const doctorData: Doctor = mockDoctor; // will fetch from Supabase later


  // Simulate available times depending on clinic
  const availableTimes = 
    (selectedClinic && doctorData.availability[selectedClinic]?.[selectedDate]) || [];

  const handleBooking = () => {
    if (!selectedClinic || !selectedService || !selectedTime) {
      Alert.alert("Incomplete", "Please select clinic, service and time slot.");
      return;
    }
    const service = doctorData.services.find((s) => s.id === selectedService);
    Alert.alert(
      "Booking Confirmed",
      `You booked ${service?.name} with ${doctorData.name} at ${doctorData.clinics.find((c) => c.id === selectedClinic)?.name} on ${selectedDate} at ${selectedTime}.`
    );

    // Later: integrate with supabase.from("appointments").insert(...)
    router.back();
  };

  // Dummy for now > to be modified later when connecting to Supabase
  const handleUpdateAppointment = async () => {
    Alert.alert("Appointment updated!", "Your changes have been saved.");
    router.replace("/(protected)/patient/(tabs)/appointments");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Doctor header */}
      <View style={styles.doctorHeader}>
        <Image source={{ uri: doctorData.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doctorData.name}</Text>
          <Text style={styles.specialization}>{doctorData.specialization}</Text>
        </View>
      </View>

      {/* Clinic Selector */}
      <Text style={styles.sectionTitle}>Choose Clinic</Text>
      <View style={styles.rowWrap}>
        {doctorData.clinics.map((clinic) => (
          <TouchableOpacity
            key={clinic.id}
            style={[
              styles.choiceButton,
              selectedClinic === clinic.id && styles.choiceSelected,
            ]}
            onPress={() => {
              setSelectedClinic(clinic.id);
              setSelectedTime(null);
            }}
          >
            <Text style={[
              styles.choiceText,
              selectedClinic === clinic.id && styles.choiceTextSelected,
            ]}>{clinic.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Service selector */}
      <Text style={styles.sectionTitle}>Select Service</Text>
      {doctorData.services.map((srv) => (
        <TouchableOpacity
          key={srv.id}
          style={[
            styles.serviceCard,
            selectedService === srv.id && styles.serviceCardSelected,
          ]}
          onPress={() => setSelectedService(srv.id)}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[
              styles.serviceName,
              selectedService === srv.id && styles.serviceTextSelected,
            ]}>{srv.name}</Text>
            <Text style={styles.price}>{srv.price}</Text>
          </View>
          <Text style={styles.duration}>{srv.duration}</Text>
        </TouchableOpacity>
      ))}

      {/* Calendar header */}
      <View style={styles.calendarHeader}>
        <Text style={styles.sectionTitle}>Select a Date & Time</Text>
        <View style={styles.viewSwitch}>
          {["daily", "weekly", "monthly"].map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.viewButton,
                viewMode === v && styles.viewButtonSelected,
              ]}
              onPress={() => setViewMode(v as any)}
            >
              <Text style={[
                styles.viewButtonText,
                viewMode === v && styles.viewButtonTextSelected,
              ]}>
                {v[0].toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))} 
        </View>
      </View>

      {/* Calendar Placeholder */}
      {viewMode === "daily" && (
        <>
          {!selectedClinic ? (
            <Text style={styles.infoText}>Select a clinic to see availability</Text>
          ) : availableTimes.length === 0 ? (
            <Text style={styles.infoText}>No slots available for this day.</Text>
          ) : (
            <View style={styles.timesContainer}>
              {availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextSelected,
                  ]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {viewMode !== "daily" && (
        <Text style={styles.infoText}>
          {viewMode === "weekly"
            ? "Weekly calendar coming soon"
            : "Monthly calendar coming soon"
          }
        </Text>
      )}

      {/* Book Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={isEditMode ? handleUpdateAppointment : handleBooking}
      >
        <Ionicons name="calendar" size={20} color="#fff" />
        <Text style={styles.bookButtonText}>
          {isEditMode ? "Update Appointment" : "Book Appointment"}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#03045e",
  },
  specialization: {
    color: "#0077b6",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    color: "#03045e",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  choiceButton: {
    backgroundColor: "#e6f2f9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceSelected: {backgroundColor: "#0077b6"},
  choiceText: {color: "#0077b6", fontWeight: "500"},
  choiceTextSelected: {color: "#fff"},
  serviceCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  serviceCardSelected: {
    borderColor: "#0077b6",
    backgroundColor: "#e6f2f9",
  },
  serviceName: {fontSize: 16, fontWeight: "600", color: "#333"},
  serviceTextSelected: {color: "#0077b6"},
  price: {fontWeight: "600", color: "#03045e"},
  duration: {color: "#777", fontSize: 13, marginTop: 2},
  calendarHeader: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewSwitch: {flexDirection: "row", gap: 6},
  viewButton: {
    borderWidth: 1,
    borderColor: "#0077b6",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewButtonSelected: {backgroundColor: "#0077b6"},
  viewButtonText: {color: "#0077b6", fontWeight: "500"},
  viewButtonTextSelected: {color: "#fff"},
  infoText: {
    textAlign: "center",
    color: "#555",
    marginVertical: 10,
  },
  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: "#0077b6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeSlotSelected: {
    backgroundColor: "#0077b6",
  },
  timeText: {
    color: "#0077b6",
    fontWeight: "500",
  },
  timeTextSelected: {color: "#fff"},
  bookButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0077b6",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
});