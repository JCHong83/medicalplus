import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Unified Interface for both Data Sources
interface CombinedDoctor {
  id?: string; // Supabase ID
  place_id?: string; // Google Place ID
  name: string;
  specialization?: string // Supabase
  category?: string; // Google
  address: string;
  rating?: number;
  distance: string; // Textual distance (e.g. "2.4 km")
  isRegistered: boolean; // The "Source" flag
  avatar?: string;
}

export default function ResultsDisplayScreen() {
  const router = useRouter();
  const { data, title } = useLocalSearchParams<{ data: string; title: string }>();

  console.log("RAW DATA RECEIVED:", data);

  // Parse the data passed from AI Assistant or Browser
  const results: CombinedDoctor[] = React.useMemo(() => {
    try {
      if (!data) return [];
      const parsed = JSON.parse(data);
      
      // Check if data is the new wrapped object or the raw array
      const doctorArray = parsed.doctors ? parsed.doctors : parsed;
      if (!Array.isArray(doctorArray)) return [];

      return doctorArray.sort((a, b) => (b.isRegistered ? 1 : 0) - (a.isRegistered ? 1 : 0));
    } catch (e) {
      console.error("Failed to parse doctors data:", e);
      return [];
    }
  }, [data]);

  const openInMaps = (address: string) => {
    const destination = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q${destination}`,
      android: `geo:0,0?q=${destination}`,
    });
    if (url) Linking.openURL(url);
  };

  const renderDoctorCard = ({ item }: { item: CombinedDoctor }) => (
    <View style={[styles.card, item.isRegistered && styles.registeredCard]}>
      {item.isRegistered && (
        <LinearGradient
          colors={['#0077b6', '#03045e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.partnerBadge}
        >
          <MaterialCommunityIcons name="check-decagram" size={14} color="#fff" />
          <Text style={styles.partnerBadgeText}>M+ PARTNER</Text>
        </LinearGradient>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.placeholderAvatar, item.isRegistered && styles.partnerAvatarBg]}>
              <Ionicons
                name={item.isRegistered ? "shield-checkmark" : "person"}
                size={28}
                color={item.isRegistered ? "#0077b6" : "#adb5bd"}
              />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.specialization}>
            {item.specialization || item.category || "Specialista"}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || "New"}</Text>
            <Text style={styles.distanceText}> • {item.distance}</Text>
          </View>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-sharp" size={14} color="#0077b6" />
        <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => openInMaps(item.address)}
        >
          <Text style={styles.secondaryButtonText}>Mappa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !item.isRegistered && styles.externalButton]}
          onPress={() => {
            if (item.isRegistered) {
              router.push({
                pathname: "/(protected)/(patient)/booking",
                params: { doctorId: item.id }
              });
            } else {
              // Fallback for non-partners
              const query = encodeURIComponent(`${item.name} ${item.address}`);
              Linking.openURL(`https://www.google.com/search?q=${query}`);
            }
          }}
        >
          <Text style={[styles.primaryButtonText, !item.isRegistered && styles.externalButtonText]}>
            {item.isRegistered ? "Prenota Ora" : "Vedi Info"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#03045e', '#0077b6']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}> Risultati per</Text>
        <Text style={styles.headerTitle}>{title || "Specialisti"}</Text>
      </LinearGradient>

      {/* AI Summary Header */}
      {(() => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.diagnosis) return null;

          return (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons name="robot-confused-outline" size={24} color="#fff" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Analisi dei Sintomi</Text>
                <Text style={styles.summaryText}>
                  Rilevato: {parsed.diagnosis.detected_symptoms.join(', ') || 'Consultazione Generale'}
                </Text>
              </View>
            </View>
          );
        } catch (e) {
          return null;
        }
      })()}

      <FlatList
        data={results}
        renderItem={renderDoctorCard}
        keyExtractor={(item, index) => item.id || item.place_id || index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-question" size={80} color="#dee2e6" />
            <Text style={styles.emptyText}>Nessun mdico trovato in questa zona.</Text>
          </View>
        }
      />
    </View>
  );
}


// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  registeredCard: { borderLeftWidth: 4, borderLeftColor: '#0077b6' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12, gap: 4 },
  partnerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  cardHeader: { flexDirection: 'row', marginBottom: 15 },
  imageContainer: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 20 },
  placeholderAvatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e9ecef' },
  partnerAvatarBg: { backgroundColor: '#eef6fb', borderColor: '#caf0f8' },
  info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  specialization: { color: '#0077b6', fontSize: 14, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 4, fontWeight: '700', color: '#495057', fontSize: 13 },
  distanceText: { color: '#6c757d', fontSize: 13 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  addressText: { marginLeft: 6, color: '#6c757d', fontSize: 13, flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 2, backgroundColor: '#0077b6', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  externalButton: { backgroundColor: '#f1f3f5' },
  externalButtonText: { color: '#495057' },
  secondaryButton: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#dee2e6' },
  secondaryButtonText: { color: '#495057', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { marginTop: 15, color: '#adb5bd', fontSize: 16, textAlign: 'center', fontWeight: '500' },
  summaryCard: {
    backgroundColor: '#eef6fb', // Very light medical blue
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#caf0f8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconContainer: {
    backgroundColor: '#0077b6',
    padding: 8,
    borderRadius: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0077b6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 15,
    color: '#023e8a',
    fontWeight: '600',
    lineHeight: 20,
  },
})