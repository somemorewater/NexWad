import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function VerifyStudent() {
  return (
    <SafeAreaView style={styles.container}>
      {/* PROGRESS */}
      <Text style={styles.step}>Step 1 of 3</Text>

      {/* LOGO */}
      <Image source={require("../assets/icon.png")} style={styles.logo} />

      <Text style={styles.title}>Student Verification</Text>
      <Text style={styles.sub}>
        Please enter your school details to verify your student account.
      </Text>

      <TextInput placeholder="Full Name" style={styles.input} />
      <TextInput placeholder="University / College" style={styles.input} />
      <TextInput placeholder="Matric Number" style={styles.input} />

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push("/verify-face-student")}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  step: { color: "#1D9BF0", fontWeight: "600", marginBottom: 12 },
  logo: { width: 60, height: 60, borderRadius: 12, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "800", marginTop: 20 },
  sub: { color: "#666", marginBottom: 24, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 10,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
