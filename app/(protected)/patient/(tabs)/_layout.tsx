import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";


export default function PatientTabsLayout() {
  return (
    
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          tabBarActiveTintColor: "#0077b6",
          tabBarInactiveTintColor: "#aaa",
          tabBarStyle: { backgroundColor: "#fff", height: 60 },
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: { color: "#03045e", fontWeight: "700" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: "Appointments",
            tabBarLabel: "Appointments",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    
  );
}