import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { appointmentApi, DoctorService } from '@/api/appointmentApi';
import { supabase } from '@/api/supabase';

export default function ManageServicesScreen() {
  const [services, setServices] = useState<DoctorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Field States
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const doctorId = "your-logged-in-doctor-uuid"; // Replace later with real auth session context

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const data = await appointmentApi.getDoctorServices(doctorId);
      setServices(data);
    } catch (e) {
      Alert.alert("Error", "Could not load existing services.");
    } finally {
      setLoading(false);
    }
  }

  const handleAddService = async () => {
    if (!name || !duration || !price) {
      Alert.alert("Incomplete Fields", "Please populate name, duration, and pricing targets.");
      return;
    }

    try {
      setSubmitting(true);
      await appointmentApi.addDoctorService({
        doctor_id: doctorId,
        name,
        duration_minutes: parseInt(duration, 10),
        price: parseFloat(price),
        description
      });

      // Clear Form Elements
      setName('');
      setDuration('');
      setPrice('');
      setDescription('');
      
      Alert.alert("Success", "Service created successfully.");
      loadServices(); // Refresh catalog array state
    } catch (err) {
      Alert.alert("Error", "Failed to add service item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Remove Service",
      "Are you sure you want to delete this treatment offering?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await appointmentApi.deleteDoctorService(id);
              loadServices();
            } catch (e) {
              Alert.alert("Error", "Could not remove targeted item.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0077b6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.pageTitle}>Service Configuration</Text>
      
      {/* Configuration Inputs */}
      <View style={styles.formCard}>
        <Text style={styles.sectionHeader}>Add New Service Type</Text>
        
        <Text style={styles.inputLabel}>Treatment / Procedure Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., Comprehensive Dental Evaluation" 
          value={name} 
          onChangeText={setName} 
        />

        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Duration (Minutes)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="30" 
              keyboardType="number-pad" 
              value={duration} 
              onChangeText={setDuration} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Cost ($ USD)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="75.00" 
              keyboardType="decimal-pad" 
              value={price} 
              onChangeText={setPrice} 
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput 
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
          placeholder="Add clinical or preparatory details..." 
          multiline 
          value={description} 
          onChangeText={setDescription} 
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddService} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publish Service</Text>}
        </TouchableOpacity>
      </View>

      {/* Existing Menu Items Display */}
      <Text style={styles.sectionHeader}>Active Catalog</Text>
      {services.length === 0 ? (
        <Text style={styles.emptyText}>No services configured yet.</Text>
      ) : (
        services.map((item) => (
          <View key={item.id} style={styles.catalogCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.catalogName}>{item.name}</Text>
              <Text style={styles.catalogMeta}>⏱️ {item.duration_minutes} mins   •   💳 ${item.price}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color="#e63946" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#03045e', marginBottom: 20 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#dee2e6', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#03045e', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', borderRadius: 10, padding: 12, fontSize: 15, color: '#212529' },
  formRow: { flexDirection: 'row', gap: 15 },
  submitBtn: { backgroundColor: '#0077b6', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  catalogCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e9ecef' },
  catalogName: { fontSize: 16, fontWeight: '700', color: '#212529' },
  catalogMeta: { fontSize: 14, color: '#6c757d', marginTop: 4 },
  deleteBtn: { padding: 8 },
  emptyText: { color: '#6c757d', textAlign: 'center', marginTop: 20 }
});