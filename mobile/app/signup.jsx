import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";

export default function Signup() {
  const [type, setType] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Choose how you want to use Bluebase
      </Text>

      {/* ACCOUNT TYPE */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeCard,
            type === "student" && styles.activeCard,
          ]}
          onPress={() => setType("student")}
        >
          <Text style={styles.typeTitle}>Student</Text>
          <Text style={styles.typeDesc}>
            Buy items & interact on feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeCard,
            type === "seller" && styles.activeCard,
          ]}
          onPress={() => setType("seller")}
        >
          <Text style={styles.typeTitle}>Seller</Text>
          <Text style={styles.typeDesc}>
            Sell products & advertise
          </Text>
        </TouchableOpacity>
      </View>

      {/* COMMON FIELDS */}
      {type && (
        <>
          <TextInput
            placeholder="Full Name"
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
          />
        </>
      )}

      {/* STUDENT FIELDS */}
      {type === "student" && (
        <TextInput
          placeholder="Matric Number"
          style={styles.input}
        />
      )}

      {/* SELLER FIELDS */}
      {type === "seller" && (
  <>
    <TextInput
      placeholder="Business / Store Name"
      style={styles.input}
    />

    <TextInput
      placeholder="BVN or NIN"
      style={styles.input}
      keyboardType="number-pad"
    />

    <TextInput
      placeholder="Phone Number"
      style={styles.input}
      keyboardType="phone-pad"
    />

    <Text style={styles.note}>
      Identity and face verification will be completed after signup.
    </Text>
  </>
  
)}

        
      

      {/* CONTINUE */}
      {type && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/setup")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    color: "#666",
    marginBottom: 24,
  },

  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  typeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
  },

  activeCard: {
    borderColor: "#1D9BF0",
    backgroundColor: "#EEF6FF",
  },

  typeTitle: {
    fontWeight: "700",
    fontSize: 16,
  },

  typeDesc: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  note: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#1D9BF0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
