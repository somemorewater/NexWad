import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function StudentSignup() {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* LOGO */}
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/icon.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Student Signup</Text>
        <Text style={styles.subtitle}>
          Join Bluebase to explore products and campus deals.
        </Text>

        <View style={styles.inputCard}>
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={fullname}
            onChangeText={setFullname}
          />
          <TextInput
            placeholder="Matric Number"
            style={styles.input}
            value={matricNo}
            onChangeText={setMatricNo}
          />
          <TextInput
            placeholder="Department"
            style={styles.input}
            value={department}
            onChangeText={setDepartment}
          />
          <TextInput
            placeholder="Level"
            style={styles.input}
            value={level}
            onChangeText={setLevel}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  logoWrap: { alignItems: "center", marginVertical: 20 },
  logo: { width: 80, height: 80, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 24 },
  inputCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1D9BF0",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
