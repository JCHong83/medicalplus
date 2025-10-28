
import React from "react";
import { View, StyleSheet } from "react-native";
import ProfilePage from "../profile";

export default function PatientProfileWrapper() {
  return (
    <View style={styles.wrapper}>
      <ProfilePage />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
});
