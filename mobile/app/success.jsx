import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Success() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const theme = {
    bg: dark ? "#000" : "#fff",
    card: dark ? "#121212" : "#fff",
    text: dark ? "#fff" : "#111",
    sub: dark ? "#aaa" : "#666",
    border: dark ? "#222" : "#eee",
    primary: "#1D9BF0",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.center}>
        {/* ICON */}
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.primary },
          ]}
        >
          <Feather name="check" size={36} color="#fff" />
        </View>

        {/* TEXT */}
        <Text style={[styles.title, { color: theme.text }]}>
          Payment Successful
        </Text>

        <Text style={[styles.subtitle, { color: theme.sub }]}>
          Your order has been placed successfully.
          The seller will contact you shortly.
        </Text>

        {/* BUTTONS */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.primaryText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { borderColor: theme.border },
          ]}
          onPress={() => router.replace("/marketplace")}
        >
          <Text style={[styles.secondaryText, { color: theme.text }]}>
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  center: {
    alignItems: "center",
  },

  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },

  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
  },

  secondaryText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
