import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Checkout() {
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

  const [payment, setPayment] = useState("wallet");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {/* DELIVERY */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Delivery / Pickup
          </Text>

          <TextInput
            placeholder="Hostel / Pickup location"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />

          <TextInput
            placeholder="Phone number"
            keyboardType="phone-pad"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
        </View>

        {/* PAYMENT METHOD */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Payment Method
          </Text>

          <PaymentOption
            title="Bluebase Wallet"
            icon="credit-card"
            active={payment === "wallet"}
            onPress={() => setPayment("wallet")}
            theme={theme}
          />

          <PaymentOption
            title="Pay on Delivery"
            icon="truck"
            active={payment === "pod"}
            onPress={() => setPayment("pod")}
            theme={theme}
          />
        </View>

        {/* ORDER SUMMARY */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Order Summary
          </Text>

          <SummaryRow label="Items total" value="₦14,300" theme={theme} />
          <SummaryRow label="Service fee" value="₦430" theme={theme} />

          <View style={styles.divider} />

          <SummaryRow label="Total" value="₦14,730" bold theme={theme} />
        </View>
      </ScrollView>

      {/* PAY BUTTON */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.replace("/success")}
        >
          <Text style={styles.payText}>Confirm & Pay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function PaymentOption({ title, icon, active, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.payment,
        {
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
    >
      <Feather name={icon} size={20} color={theme.primary} />
      <Text style={{ color: theme.text, marginLeft: 10, flex: 1 }}>
        {title}
      </Text>
      {active && <Feather name="check-circle" size={18} color={theme.primary} />}
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, bold, theme }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.sub }}>{label}</Text>
      <Text
        style={{
          color: theme.text,
          fontWeight: bold ? "800" : "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    marginTop:20,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },

  card: {
    margin: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },

  payment: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    opacity: 0.2,
    marginVertical: 10,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },

  payBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
