import React from "react";
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/context/AuthContext';
import { RoleProvider } from "../src/context/RoleContext";

function RootNavigator() {

    return (
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitleAlign: "center",
          headerTintColor: "#03045e",
        }}
      >
        {/* Public routes */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Protected routes */}
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />

        {/* Shared routes */}
        <Stack.Screen name="(common)" options={{ headerShown: false }} />
      </Stack>
    );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RoleProvider>
          <RootNavigator />
        </RoleProvider>
      </AuthProvider>
    </PaperProvider>
  );
}