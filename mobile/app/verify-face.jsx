import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function VerifyFace() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.step}>Step 2 of 3</Text>

      <Image source={require("../assets/icon.png")} style={styles.logo} />

      <Text style={styles.title}>Face Verification</Text>
      <Text style={styles.sub}>
        We’ll scan your face to confirm your identity. This helps keep Bluebase safe.
      </Text>

      <View style={styles.cameraMock}>
        <Text style={{ color: "#888" }}>Camera Preview</Text>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace("/seller-signup")}
      >
        <Text style={styles.btnText}>Finish Setup</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  step: { color: "#1D9BF0", fontWeight: "600", marginBottom: 12 },
  logo: { width: 60, height: 60, borderRadius: 12, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "800", marginTop: 20 },
  sub: { color: "#666", marginBottom: 30, lineHeight: 22 },
  cameraMock: {
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
