import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../../src/api/supabaseClient";

export default function SignupScreen() {
  const router = useRouter();

  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPasword] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // 1. Create user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            certificate_id: certificateId || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      const user = data.user;

      if (!user) {
        setLoading(false);
        Alert.alert("Check your inbox", "Confirm your email before logging in.");
        router.replace("/auth/login");
        return;
      }

      // 2. Create profile row manually (if you don't have a trigger)
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName,
          role,
        },
      ]);

      if (profileError) {
        console.warn("Profile insert failed (maybe trigger exists):", profileError.message);
      }

      // 3. Optionally, create doctor record if doctor
      if (role === "doctor") {
        const { error: doctorError } = await supabase.from("doctors").insert([
          {
            id: user.id,
            license_number: certificateId,
            verification_status: "pending",
          },
        ]);

        if (doctorError) console.warn("Doctor insert failed:", doctorError.message);
      }

      // 4. Redirect
      setLoading(false);
      Alert.alert(
        "Account created",
        role === "doctor"
          ? "Your doctor account is pending verification."
          : "Welcome! You can now book appointments."
      );
      router.replace(role === "doctor" ? "/doctor" : "/patient");
    } catch (err: any) {
      setError(err.message || "SignUp failed");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join as a {role === "doctor" ? "Doctor" : "Patient"}</Text>

      {/* Role Selector */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "patient" && styles.roleSelected]}
          onPress={() => setRole("patient")}
        >
          <Text style={[styles.roleText, role === "patient" && styles.roleTextSelected]}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "doctor" && styles.roleSelected]}
          onPress={() => setRole("doctor")}
        >
          <Text style={[styles.roleText, role === "doctor" && styles.roleTextSelected]}>Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Form Inputs */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPasword}
        />

        {role === "doctor" && (
          <TextInput
            style={styles.input}
            placeholder="Medical Licence / Certificate ID"
            placeholderTextColor="#888"
            value={certificateId}
            onChangeText={setCertificateId}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#03045e",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 52,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0077b6",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  link: {
    color: "#0077b6",
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 16,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: "#0077b6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  roleSelected: {
    backgroundColor: "#0077b6",
  },
  roleText: {
    color: "#0077b6",
    fontSize: 16,
    fontWeight: "500",
  },
  roleTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: -8,
  },
});