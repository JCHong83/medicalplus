import { Stack } from "expo-router";

export default function DoctorRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main tab navigation */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Hidden or non-tab screens */}
      <Stack.Screen
        name="clinics"
        options={{
          headerShown: true,
          title: "Clinics",
        }}
      />
      <Stack.Screen
        name="services"
        options={{
          headerShown: true,
          title: "Services",
        }}
      />
      <Stack.Screen
        name="patients/[id]"
        options={{
          headerShown: true,
          title: "Patient Details",
        }}
      />
    </Stack>
  );
}