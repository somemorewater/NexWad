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

export default function VerifySeller() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.step}>Step 1 of 3</Text>

      <Image source={require("../assets/icon.png")} style={styles.logo} />

      <Text style={styles.title}>Seller Verification</Text>
      <Text style={styles.sub}>
        Sellers are verified to keep the marketplace safe and trusted.
      </Text>

      <TextInput placeholder="Business / Full Name" style={styles.input} />
      <TextInput placeholder="BVN or NIN" style={styles.input} />
      <TextInput placeholder="Phone Number" style={styles.input} />

      <TouchableOpacity
        style={styles.upload}
        onPress={() => {}}
      >
        <Text style={styles.uploadText}>Upload ID / Selfie</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push("/verify-face")}
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
  upload: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#1D9BF0",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  uploadText: { color: "#1D9BF0", fontWeight: "600" },
  btn: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
