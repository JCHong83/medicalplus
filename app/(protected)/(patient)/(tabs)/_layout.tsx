import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          tabBarActiveTintColor: "#0077b6",
          tabBarInactiveTintColor: "#aaa",
          tabBarStyle: { 
            // Add extra padding at the bottom based on the device inset
            // We add a base of 10 plus the inset to lift it off the buttons
            height: Platform.OS === 'android' ? 60 + insets.bottom : 80,
            paddingBottom: Platform.OS === 'android' ? insets.bottom + 8 : 25,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            elevation: 8, // Add shadow for Android
           },
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
          name="ai-assistant"
          options={{
            title: "AI Assistant",
            tabBarLabel: "AI Assistant",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
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