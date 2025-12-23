import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Cart() {
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

  const [items, setItems] = useState([
    {
      id: 1,
      name: "Physics Textbook",
      price: 4500,
      qty: 1,
      image: "https://picsum.photos/200?1",
    },
    {
      id: 2,
      name: "Scientific Calculator",
      price: 9800,
      qty: 1,
      image: "https://picsum.photos/200?2",
    },
  ]);

  const increaseQty = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  };

  const decreaseQty = (id) => {
    setItems(items.map(i =>
      i.id === id && i.qty > 1 ? { ...i, qty: i.qty - 1 } : i
    ));
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const serviceFee = subtotal * 0.03;
  const total = subtotal + serviceFee;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Your Cart</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* CART ITEMS */}
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {items.length === 0 && (
          <View style={styles.empty}>
            <Feather name="shopping-cart" size={40} color={theme.sub} />
            <Text style={{ color: theme.sub, marginTop: 10 }}>
              Your cart is empty
            </Text>
          </View>
        )}

        {items.map(item => (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Image source={{ uri: item.image }} style={styles.image} />

            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={{ color: theme.sub }}>
                ₦{item.price.toLocaleString()}
              </Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => decreaseQty(item.id)}>
                  <Feather name="minus-circle" size={20} color={theme.primary} />
                </TouchableOpacity>

                <Text style={[styles.qty, { color: theme.text }]}>
                  {item.qty}
                </Text>

                <TouchableOpacity onPress={() => increaseQty(item.id)}>
                  <Feather name="plus-circle" size={20} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={{ marginLeft: "auto" }}
                >
                  <Feather name="trash-2" size={18} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* SUMMARY */}
      {items.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={{ color: theme.sub }}>Subtotal</Text>
            <Text style={{ color: theme.text }}>
              ₦{subtotal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={{ color: theme.sub }}>Service fee</Text>
            <Text style={{ color: theme.text }}>
              ₦{serviceFee.toFixed(0)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={[styles.totalText, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalText, { color: theme.text }]}>
              ₦{total.toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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

  empty: {
    marginTop: 120,
    alignItems: "center",
  },

  card: {
    flexDirection: "row",
    margin: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },

  qty: {
    fontSize: 14,
    fontWeight: "600",
  },

  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 10,
    opacity: 0.2,
  },

  totalText: {
    fontSize: 16,
    fontWeight: "800",
  },

  checkoutBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
