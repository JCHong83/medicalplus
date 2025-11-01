import React from 'react';
import { Stack } from "expo-router";
import { View, ActivityIndicator } from 'react-native';

export default function CommonLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerTintColor: "#03045e",
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}