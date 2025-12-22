import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>
        Login to continue on Bluebase
      </Text>

      {/* INPUTS */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
      />

      {/* LOGIN BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/home")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* EXTRA */}
      <TouchableOpacity>
        <Text style={styles.forgot}>Forgot password?</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don’t have an account?
        </Text>
        <TouchableOpacity onPress={() => router.push("/setup")}>
          <Text style={styles.signup}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    color: "#666",
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#1D9BF0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  forgot: {
    textAlign: "center",
    marginTop: 12,
    color: "#888",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 26,
  },

  footerText: {
    color: "#555",
  },

  signup: {
    color: "#1D9BF0",
    fontWeight: "700",
  },
});
