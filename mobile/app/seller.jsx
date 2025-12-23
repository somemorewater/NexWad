import React from "react";
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

export default function Seller() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const theme = {
    bg: dark ? "#000" : "#fff",
    card: dark ? "#121212" : "#fff",
    text: dark ? "#fff" : "#111",
    sub: dark ? "#aaa" : "#666",
    border: dark ? "#222" : "#eee",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Seller
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* PROFILE */}
        <View style={styles.profileWrap}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=8" }}
            style={styles.avatar}
          />
          <Text style={[styles.name, { color: theme.text }]}>
            Campus Bookstore
          </Text>
          <Text style={{ color: theme.sub }}>⭐ 4.8 · Trusted Seller</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => router.push("/message")}
            >
              <Text style={styles.messageText}>Message</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.bio, { color: theme.sub }]}>
            Selling original textbooks, past questions, and study materials for
            university students.
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat label="Products" value="42" theme={theme} />
          <Stat label="Sales" value="1.2k" theme={theme} />
          <Stat label="Reviews" value="318" theme={theme} />
        </View>

        {/* PRODUCTS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Products
        </Text>

        <SellerProduct theme={theme} />
        <SellerProduct theme={theme} />
        <SellerProduct theme={theme} />

        {/* REVIEWS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Reviews
        </Text>

        <Review name="Daz" text="Fast delivery and clean books 👍" />
        <Review name="Blessing" text="Very reliable seller" />
        <Review name="Jamal" text="Good prices, will buy again" />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.nav, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <NavIcon icon="home" onPress={() => router.push("/home")} />
        <NavIcon icon="search" onPress={() => router.push("/discover")} />
        <NavIcon icon="shopping-bag" onPress={() => router.push("/marketplace")} />
        <NavIcon icon="user" active />
      </View>
    </SafeAreaView>
  );
}

/* ===== COMPONENTS ===== */

function Stat({ label, value, theme }) {
  return (
    <View style={[styles.statBox, { borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={{ color: theme.sub, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function SellerProduct({ theme }) {
  return (
    <TouchableOpacity
      style={[styles.productCard, { borderColor: theme.border }]}
      onPress={() => router.push("/product")}
    >
      <Image
        source={{ uri: "https://picsum.photos/300" }}
        style={styles.productImg}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.productTitle, { color: theme.text }]}>
          Physics Textbook
        </Text>
        <Text style={{ color: theme.sub }}>₦3,500</Text>
      </View>
      <Feather name="chevron-right" size={18} color={theme.sub} />
    </TouchableOpacity>
  );
}

function Review({ name, text }) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewName}>{name}</Text>
      <Text style={styles.reviewText}>⭐ 5.0 · {text}</Text>
    </View>
  );
}

function NavIcon({ icon, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Feather
        name={icon}
        size={22}
        color={active ? "#1D9BF0" : "#888"}
      />
    </TouchableOpacity>
  );
}

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop:20,
  },

  headerTitle: { fontSize: 16, fontWeight: "700" },

  profileWrap: {
    alignItems: "center",
    padding: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },

  name: { fontSize: 18, fontWeight: "800" },

  bio: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  followBtn: {
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  followText: {
    color: "#fff",
    fontWeight: "700",
  },

  messageBtn: {
    borderWidth: 1,
    borderColor: "#1D9BF0",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  messageText: {
    color: "#1D9BF0",
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 14,
  },

  statBox: {
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
    width: 90,
  },

  statValue: {
    fontWeight: "800",
    fontSize: 16,
  },

  sectionTitle: {
    margin: 14,
    fontSize: 16,
    fontWeight: "700",
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  productImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },

  productTitle: { fontWeight: "700" },

  reviewCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  reviewName: { fontWeight: "700" },

  reviewText: {
    color: "#666",
    marginTop: 4,
  },

  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
