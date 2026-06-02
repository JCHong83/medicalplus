import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// API & Database Imports
import { appointmentApi, DoctorService } from '@/api/appointmentApi';
import { supabase } from '@/api/supabase';

interface Clinic {
  id: string;
  name: string;
  address: string;
}

export default function BookingScreen() {
  const router = useRouter();
  const { doctorId, appointmentId, mode } = useLocalSearchParams<{ 
    doctorId?: string;
    appointmentId?: string;
    mode?: string;
  }>();

  const isEditMode = mode === "edit";

  // --- State Management ---
  const [doctor, setDoctor] = useState<any>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [services, setServices] = useState<DoctorService[]>([]);
  
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedService, setSelectedService] = useState<DoctorService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // --- Date Generation (Elderly Friendly Selection) ---
  const availableDays = React.useMemo(() => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    // Start from tomorrow to avoid "past time" booking complexity for now
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        raw: d.toISOString().split('T')[0],
        formatted: d.toLocaleDateString('en-US', options)
      });
    }
    return days;
  }, []);

  // --- Data Initialization ---
  useEffect(() => {
    async function loadDoctorData() {
      if (!doctorId) return;
      try {
        setLoading(true);
        
        // 1. Fetch Doctor Info and Clinics
        const { data, error } = await supabase
          .from('doctors')
          .select(`
            id, 
            specialties, 
            profiles(full_name, avatar_url), 
            doctor_clinics(clinics(id, name, address))
          `)
          .eq('id', doctorId)
          .single();

        if (error) throw error;

        if (data) {
          const profileData = data.profiles as unknown as { full_name: string, avatar_url: string } | null;

          setDoctor({
            name: profileData?.full_name || 'Unknown Doctor',
            avatar: profileData?.avatar_url || 'https://via.placeholder.com/150',
            specialty: data.specialties?.[0] || 'Specialist'
          });
          
          const rawClinics = (data.doctor_clinics as any[] || [])
            .map((dc) => dc.clinics)
            .filter(Boolean); // Cleans out any null values safely

          setClinics(rawClinics);
          if (rawClinics.length > 0) setSelectedClinic(rawClinics[0]);
        }

        // 2. Fetch Services
        const fetchedServices = await appointmentApi.getDoctorServices(doctorId);
        setServices(fetchedServices);
        if (fetchedServices.length > 0) setSelectedService(fetchedServices[0]);

        // 3. Set default date
        setSelectedDate(availableDays[0].raw);

      } catch (e) {
        console.error("Initialization Error:", e);
        Alert.alert("Error", "Could not load doctor availability.");
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, [doctorId]);

  // --- Slot Fetching Logic ---
  useEffect(() => {
    async function updateAvailableSlots() {
      if (!doctorId || !selectedService || !selectedDate) return;
      
      try {
        setLoadingSlots(true);
        const freeSlots = await appointmentApi.getAvailableSlots(
          doctorId, 
          selectedService.id, 
          selectedDate
        );
        setSlots(freeSlots);
        setSelectedSlot(null); // Reset when parameters change
      } catch (e) {
        console.error("Slot Fetch Error:", e);
      } finally {
        setLoadingSlots(false);
      }
    }
    updateAvailableSlots();
  }, [selectedService, selectedDate, selectedClinic]);

  // --- Actions ---
  const handleBookingSubmission = async () => {
    try {
      setConfirmModalVisible(false);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to book");

      const payload = {
        doctor_id: doctorId!,
        patient_id: user.id,
        clinic_id: selectedClinic!.id,
        service_id: selectedService!.id,
        start_ts: `${selectedDate}T${selectedSlot}:00Z`,
        notes: isEditMode ? `Updated from App (Prev ID: ${appointmentId})` : "Booked via MedicalPlus AI Assistant"
      };

      await appointmentApi.bookAppointment(payload);
      
      Alert.alert(
        "Booking Successful", 
        "Your appointment has been confirmed.",
        [{ text: "Great", onPress: () => router.dismissAll() }]
      );
    } catch (err: any) {
      Alert.alert("Error", "This slot may have just been taken. Please try another time.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header Block */}
      <View style={styles.doctorHeader}>
        <Image source={{ uri: doctor?.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doctor?.name}</Text>
          <Text style={styles.specialization}>{doctor?.specialty}</Text>
        </View>
      </View>

      {/* 1. Clinic Choice */}
      <Text style={styles.sectionTitle}>1. Choose Clinic</Text>
      <View style={styles.rowWrap}>
        {clinics.map((clinic) => (
          <TouchableOpacity
            key={clinic.id}
            style={[styles.choiceButton, selectedClinic?.id === clinic.id && styles.choiceSelected]}
            onPress={() => setSelectedClinic(clinic)}
          >
            <Text style={[styles.choiceText, selectedClinic?.id === clinic.id && styles.choiceTextSelected]}>
              {clinic.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Service Selection (Cards for better readability) */}
      <Text style={styles.sectionTitle}>2. Select Service</Text>
      {services.map((srv) => (
        <TouchableOpacity
          key={srv.id}
          style={[styles.serviceCard, selectedService?.id === srv.id && styles.serviceCardSelected]}
          onPress={() => setSelectedService(srv)}
        >
          <View style={styles.serviceInfoRow}>
            <Text style={[styles.serviceName, selectedService?.id === srv.id && styles.serviceTextSelected]}>
              {srv.name}
            </Text>
            <Text style={styles.price}>${srv.price}</Text>
          </View>
          <Text style={styles.duration}>{srv.duration_minutes} Minutes</Text>
        </TouchableOpacity>
      ))}

      {/* 3. Day Picker (Horizontal Scroll) */}
      <Text style={styles.sectionTitle}>3. Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
        {availableDays.map((day) => (
          <TouchableOpacity
            key={day.raw}
            style={[styles.dateCard, selectedDate === day.raw && styles.dateCardSelected]}
            onPress={() => setSelectedDate(day.raw)}
          >
            <Text style={[styles.dateDayText, selectedDate === day.raw && styles.whiteText]}>
              {day.formatted.split(',')[0]}
            </Text>
            <Text style={[styles.dateNumText, selectedDate === day.raw && styles.whiteText]}>
              {day.formatted.split(',')[1]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 4. Time Slots */}
      <Text style={styles.sectionTitle}>4. Available Times</Text>
      {loadingSlots ? (
        <ActivityIndicator color="#0077b6" style={{ margin: 20 }} />
      ) : slots.length === 0 ? (
        <Text style={styles.infoText}>No slots available for this day. Try another date.</Text>
      ) : (
        <View style={styles.timesContainer}>
          {slots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.timeSlot, selectedSlot === time && styles.timeSlotSelected]}
              onPress={() => {
                setSelectedSlot(time);
                setConfirmModalVisible(true);
              }}
            >
              <Text style={[styles.timeText, selectedSlot === time && styles.timeTextSelected]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Final Booking Confirmation Popup */}
      <Modal visible={confirmModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={50} color="#0077b6" style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitle}>Confirm Appointment</Text>
            
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>📍 {selectedClinic?.name}</Text>
              <Text style={styles.summaryText}>🩺 {selectedService?.name}</Text>
              <Text style={styles.summaryText}>⏰ {selectedDate} at {selectedSlot}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={handleBookingSubmission}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doctorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 25, backgroundColor: '#fff', padding: 15, borderRadius: 15, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 18, fontWeight: "700", color: "#03045e" },
  specialization: { color: "#0077b6", fontSize: 14, fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 15, color: "#03045e", textTransform: 'uppercase' },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  choiceButton: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: '#dee2e6' },
  choiceSelected: { backgroundColor: "#0077b6", borderColor: '#0077b6' },
  choiceText: { color: "#495057", fontWeight: "600" },
  choiceTextSelected: { color: "#fff" },
  serviceCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: "#dee2e6", borderRadius: 12, padding: 15, marginBottom: 10 },
  serviceCardSelected: { borderColor: "#0077b6", backgroundColor: "#eef6fb" },
  serviceInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#333" },
  serviceTextSelected: { color: "#0077b6" },
  price: { fontWeight: "700", color: "#03045e", fontSize: 16 },
  duration: { color: "#6c757d", fontSize: 13, marginTop: 4 },
  dateList: { marginBottom: 10 },
  dateCard: { backgroundColor: '#fff', width: 80, height: 80, justifyContent: 'center', alignItems: 'center', borderRadius: 15, marginRight: 10, borderWidth: 1, borderColor: '#dee2e6' },
  dateCardSelected: { backgroundColor: '#0077b6', borderColor: '#0077b6' },
  dateDayText: { fontSize: 12, color: '#6c757d', fontWeight: '600' },
  dateNumText: { fontSize: 18, fontWeight: '700', color: '#03045e' },
  whiteText: { color: '#fff' },
  timesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  timeSlot: { backgroundColor: '#fff', width: '30%', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#0077b6' },
  timeSlotSelected: { backgroundColor: "#0077b6" },
  timeText: { color: "#0077b6", fontWeight: "700" },
  timeTextSelected: { color: "#fff" },
  infoText: { textAlign: "center", color: "#6c757d", marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#03045e', textAlign: 'center', marginVertical: 15 },
  summaryBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 20 },
  summaryText: { fontSize: 15, color: '#495057', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#f1f3f5', alignItems: 'center' },
  cancelBtnText: { color: '#495057', fontWeight: '700' },
  confirmBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#0077b6', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});