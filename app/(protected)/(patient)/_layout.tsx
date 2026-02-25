import { Stack } from "expo-router";

export default function PatientRootLayout() {

  console.log("✅ [Patient Tabs Mounted]");
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tabs Navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Hidden pages (outside of tabs) */}
      <Stack.Screen 
        name="booking"
        options={{ 
          presentation: "modal",
          headerShown: true,
          title: "Book Appointment"
        }}
      />
      <Stack.Screen
        name="doctor/[id]"
        options={{
          headerShown: true,
          title: "Doctor Profile"
        }}
      />
    </Stack>
  );
}