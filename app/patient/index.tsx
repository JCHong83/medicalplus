import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/api/supabaseClient';
import React from 'react';

export default function PatientHome() {
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('doctors').select('user_id, specialty, users(full_name');
      setDoctors(data || []);
    })();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize:22, marginBottom:12 }}>Find a Doctor</Text>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <Text>{item.users.full_name} - {item.specialty}</Text>
        )}
      />
    </View>
  )
}