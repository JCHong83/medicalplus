import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/api/supabaseClient";
import { useRouter } from "expo-router";

export default function EditProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        setFullName(data.user.user_metadata?.full_name || "");
        setAvatarUrl(data.user.user_metadata?.avatar_url || null);
      }
    })();
  }, []);

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please grant access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      await uploadAvatar(file.uri);
    }
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("profile-avatars")
        .upload(__filename, blob, {
          upsert: true,
          contentType: "image/jpeg",
        });
      
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-avatars").getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed", "Could not upload your image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      const updates = {
        full_name: fullName,
        avatar_url: avatarUrl,
      };

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Avatar */}
      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {uploading ? (
          <ActivityIndicator color="#0077b6" />
        ) : (
          <Image
            source={{
              uri:
                avatarUrl ||
                "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.avatar}
          />
        )}
        <View style={styles.cameraIcon}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Full name input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          style={styles.input}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>SaveChanges</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: "#f6f8fa",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#555",
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#03045e",
    marginBottom: 30,
  },
  avatarContainer: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#0077b6",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0077b6",
    borderRadius: 16,
    padding: 6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#03045e",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#0077b6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});