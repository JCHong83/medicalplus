import { useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert} from 'react-native';
import { supabase } from '../../src/api/supabaseClient';
import { AuthContext } from '../../src/context/AuthContext';
import { router } from 'expo-router';

import React from 'react'

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { session } = useContext(AuthContext);

  const handleLogin = async () => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else {
      // Redirect to correct dashboard
      const role = data.user.user_metadata.role;
      router.replace(role === 'doctor' ? '/doctor' : '/patient');
    }
  };

  return (
    <View style={{ flex:1, justifyContent:'center', padding:20 }}>
      <Text style={{ fontSize:24, marginBottom:12 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  )
}