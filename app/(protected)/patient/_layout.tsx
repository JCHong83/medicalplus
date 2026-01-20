import { Stack, useRouter } from "expo-router";

export default function PatientRootLayout() {

  console.log("✅ [Patient Tabs Loaded]", new Error().stack);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tabs Navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Hidden pages (outside of tabs) */}
      <Stack.Screen name="booking" options={{ presentation: "modal" }} />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: true, title: "Doctor" }} />
      <Stack.Screen name="components/AppointmentItem" options={{ headerShown: false }} />
      <Stack.Screen name="components/DoctorCard" options={{ headerShown: false }} />
      <Stack.Screen name="components/FilterBar" options={{ headerShown: false }} />
    </Stack>
  )
}