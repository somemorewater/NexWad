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

export default function SellerSignup() {
  const [fullname, setFullname] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
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

        <Text style={styles.title}>Seller Signup</Text>
        <Text style={styles.subtitle}>
          Create your business account and start selling on Bluebase.
        </Text>

        <View style={styles.inputCard}>
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={fullname}
            onChangeText={setFullname}
          />
          <TextInput
            placeholder="Business / Store Name"
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextInput
            placeholder="Phone Number"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="Type of Business"
            style={styles.input}
            value={businessType}
            onChangeText={setBusinessType}
          />
          <TextInput
            placeholder="Business Details"
            style={[styles.input, { height: 100 }]}
            value={businessDetails}
            onChangeText={setBusinessDetails}
            multiline
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
