import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../../src/api/supabaseClient';

interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  services: string[];
  clinics: string[];
  distance: number; // km
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<{ specialization?: string; service?: string }>({});
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Simulate fetching from Supabase
  const fetchDoctors = async (pageNum = 1) => {
    setLoading(true);

    // Simulated API data (later it will be replaced with Supabase query)
    const mockDoctors: Doctor[] = Array.from({ length: 20}, (_, i) => ({
      id: `doc-${pageNum}-${i}`,
      name: `Dr. ${["Smith", "Brown", "Taylor", "Lee", "Nguyen", "Khan"][i % 6]}`,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      specialization: ["Cardiology", "Dermatology", "Orthopedics", "Pediatrics"][i % 4],
      services: ["consultation", "Checkup", "Therapy"].slice(0, (i % 3) + 1),
      clinics: ["Healthcare Center", "Downtown Clinic", "City Hospital"].slice(0, (i % 3) + 1),
      distance: Math.round(Math.random() * 30 + 1),
    }));

    // Simulate pagination
    const moreAvailable = pageNum < 3; // only 3 pages of mock data
    await new Promise((r) => setTimeout(r, 500));

    setDoctors((prev) => (pageNum === 1 ? mockDoctors : [...prev, ...mockDoctors]));
    setHasMore(moreAvailable);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = () => {
    // TODO: connect to Supabase and apply filters/search
    fetchDoctors(1);
  };

  const loadMore = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDoctors(nextPage);
    }
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Services:</Text>
        <Text style={styles.sectionText}>{item.services.join(", ")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Clinics:</Text>
        <Text style={styles.sectionText}>{item.clinics.join(", ")}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.distance}>{item.distance} km away</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push(`/patient/book?doctor=${item.id}`)}
        >
          <Text style={styles.bookText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#555" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, location, specialization, or service"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="funnel" size={18} color="#0077b6" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="navigate" size={18} color="#0077b6" />
          <Text style={styles.filterText}>Distance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="medkit" size={18} color="#0077b6" />
          <Text style={styles.filterText}>Specialization</Text>
        </TouchableOpacity>
      </View>

      {/* Doctor List */}
      {loading && doctors.length === 0 ? (
        <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={doctors.sort((a, b) => a.distance - b.distance)}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctorCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.endText}>No more doctors to show</Text>
            )
          }
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f2f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterText: {
    marginLeft: 4,
    color: "#0077b6",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#03045e",
  },
  specialization: {
    color: "#0077b6",
    fontWeight: "500",
  },
  section: {
    marginTop: 6,
  },
  sectionLabel: {
    fontWeight: "600",
    color: "#333",
  },
  sectionText: {
    color: "#555",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  distance: {
    color: "#999",
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: "#0077b6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadMore: {
    alignSelf: "center",
    padding: 10,
    marginVertical: 16,
  },
  loadMoreText: {
    color: "#0077b6",
    fontWeight: "600",
  },
  endText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
  },
});