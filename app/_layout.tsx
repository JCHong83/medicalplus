import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';

import { View, Text } from 'react-native'
import React from 'react'

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}