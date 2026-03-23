import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { aiAgentService } from "../../../../src/api/aiAgent";

export default function BrowseDoctorsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [radius, setRadius] = useState(5);
  const [isSearching, setIsSearching] = useState(false);

  const radiusOptions = [2, 5, 10, 20];

  const handleSearch = async (useCurrentLocation = false) => {
    setIsSearching(true);
    try {
      let lat, lng;

      if (useCurrentLocation) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "We need location access to find doctors nearby.");
          setIsSearching(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } else {
        // Default coordinates (e.g., Milan) if no specific address logic is yet implemented
        // In a real app, you'd geocode the 'locationInput' string here
        lat = 45.4642; 
        lng = 9.1900;
      }

      // We reuse the aiAgentService's sendChat logic or a dedicated manual search call
      // For now, we simulate the backend call that returns CombinedDoctor[]
      const response = await aiAgentService.sendChat([
        { role: "user", content: `Find me a ${query} in ${locationInput || 'my area'}` }
      ]);

      router.push({
        pathname: "/(protected)/(patient)/results-display",
        params: { 
          data: JSON.stringify(response.doctors), 
          title: query || "Medical Facilities" 
        }
      });

    } catch (error) {
      Alert.alert("Search Failed", "Could not fetch results. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Find a Specialist</Text>
      
      {/* SEARCH CARD */}
      <View style={styles.searchCard}>
        <Text style={styles.label}>Who are you looking for?</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#0077b6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Name, Specialty (e.g. Cardiologist)"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Where?</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="location-outline" size={20} color="#0077b6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="City or Street Name"
            value={locationInput}
            onChangeText={setLocationInput}
          />
        </View>

        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => handleSearch(true)}
        >
          <Ionicons name="navigate" size={16} color="#0077b6" />
          <Text style={styles.locationButtonText}>Use my current location</Text>
        </TouchableOpacity>
      </View>

      {/* RADIUS SELECTOR */}
      <Text style={styles.label}>Search Radius (km)</Text>
      <View style={styles.radiusContainer}>
        {radiusOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.radiusBox, radius === option && styles.radiusBoxActive]}
            onPress={() => setRadius(option)}
          >
            <Text style={[styles.radiusText, radius === option && styles.radiusTextActive]}>
              {option}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH BUTTON */}
      <TouchableOpacity 
        style={styles.mainSearchButton} 
        onPress={() => handleSearch(false)}
        disabled={isSearching}
      >
        {isSearching ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.mainSearchButtonText}>Search Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#03045e', marginBottom: 24 },
  searchCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4f7', borderRadius: 12, paddingHorizontal: 12, height: 55 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  locationButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-start', padding: 4 },
  locationButtonText: { color: '#0077b6', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  radiusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 30 },
  radiusBox: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  radiusBoxActive: { backgroundColor: '#0077b6', borderColor: '#0077b6' },
  radiusText: { color: '#666', fontWeight: '600' },
  radiusTextActive: { color: '#fff' },
  mainSearchButton: { backgroundColor: '#0077b6', height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#0077b6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  mainSearchButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});