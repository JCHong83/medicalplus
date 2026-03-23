import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      return Array.isArray(parsed) ? parsed : [];
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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Medical+ Partner</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Ionicons name="medkit" size={24} color="#0077b6" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialization}>
            {item.specialization || item.category || "Medical Facility"}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || "N/A"}</Text>
            <Text style={styles.distanceText}> • {item.distance}</Text>
          </View>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => openInMaps(item.address)}
        >
          <Ionicons name="navigate-outline" size={18} color="#0077b6" />
          <Text style={styles.secondaryButtonText}>Directions</Text>
        </TouchableOpacity>

        {item.isRegistered ? (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push({
              pathname: "/(protected)/(patient)/booking",
              params: { doctorId: item.id }
            })}
          >
            <Text style={styles.primaryButtonText}>Book Now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#f0f0f0' }]} 
            onPress={() => item.place_id && Linking.openURL(`tel:${item.place_id}`)} // Placeholder for Phone
          >
            <Text style={[styles.primaryButtonText, { color: '#666' }]}>Contact</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#03045e', '#0077b6']} style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || "Specialists Near You"}</Text>
      </LinearGradient>

      <FlatList
        data={results}
        renderItem={renderDoctorCard}
        keyExtractor={(item, index) => item.id || item.place_id || index.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No specialists found in this area.</Text>
          </View>
        }
      />
    </View>
  );
}


// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  topBar: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  registeredCard: { borderColor: '#0077b6', borderWidth: 1 },
  badge: { backgroundColor: '#0077b6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  imageContainer: { marginRight: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  placeholderAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e6f2f9', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#333' },
  specialization: { color: '#0077b6', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 4, fontWeight: '600', color: '#444' },
  distanceText: { color: '#888', fontSize: 13 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#f0f4f7', padding: 8, borderRadius: 8 },
  addressText: { marginLeft: 6, color: '#666', fontSize: 13, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  primaryButton: { flex: 1, backgroundColor: '#0077b6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#0077b6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
  secondaryButtonText: { color: '#0077b6', fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 }
})