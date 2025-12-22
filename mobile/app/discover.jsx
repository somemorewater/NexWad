import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Discover() {
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
        <Text style={[styles.logo, { color: theme.text }]}>Discover</Text>
      </View>

      {/* SEARCH */}
      <View style={[styles.searchWrap, { borderColor: theme.border }]}>
        <Feather name="search" size={16} color={theme.sub} />
        <TextInput
          placeholder="Search products, sellers..."
          placeholderTextColor={theme.sub}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* TRENDING SELLERS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Trending Sellers
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SellerCard name="Campus Store" rating="4.8" />
          <SellerCard name="Book Plug" rating="4.6" />
          <SellerCard name="Tech Mart" rating="4.9" />
        </ScrollView>

        {/* TRENDING POSTS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Trending Now
        </Text>

        <PostCard theme={theme} />
        <PostCard theme={theme} />

        {/* SPONSORED */}
        <View style={[styles.ad, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.sponsored}>Sponsored</Text>
          <Text style={{ color: theme.text, fontWeight: "700", marginTop: 4 }}>
            Sell faster on BlueBase
          </Text>
          <Text style={{ color: theme.sub }}>
            Promote your product to more buyers
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.nav, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <NavIcon icon="home" onPress={() => router.push("/home")} />
        <NavIcon icon="search" active />
        <NavIcon icon="shopping-bag" onPress={() => router.push("/marketplace")} />
        <NavIcon icon="user" onPress={() => router.push("/profile")} />
      </View>
    </SafeAreaView>
  );
}

/* ================= COMPONENTS ================= */

function SellerCard({ name, rating }) {
  return (
    <View style={styles.sellerCard}>
      <Image
        source={{ uri: "https://picsum.photos/100" }}
        style={styles.sellerAvatar}
      />
      <Text style={styles.sellerName}>{name}</Text>
      <Text style={styles.rating}>{rating}★</Text>
    </View>
  );
}

function PostCard({ theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Image
        source={{ uri: "https://picsum.photos/500/300" }}
        style={styles.postImage}
      />
      <Text style={[styles.postTitle, { color: theme.text }]}>
        New arrivals this week
      </Text>
      <Text style={{ color: theme.sub }}>
        Affordable study materials available now
      </Text>
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    padding: 14,
    borderBottomWidth: 1,
    marginTop:20,
  },

  logo: {
    fontSize: 20,
    fontWeight: "800",
  },

  searchWrap: {
    margin: 14,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    marginLeft: 8,
    flex: 1,
  },

  sectionTitle: {
    marginHorizontal: 14,
    marginVertical: 10,
    fontSize: 16,
    fontWeight: "700",
  },

  sellerCard: {
    width: 110,
    marginLeft: 14,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#1D9BF0",
    alignItems: "center",
  },

  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },

  sellerName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },

  rating: {
    color: "#fff",
    fontSize: 12,
  },

  card: {
    margin: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  postImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },

  postTitle: {
    fontWeight: "700",
  },

  sponsored: {
    color: "#1D9BF0",
    fontSize: 12,
    fontWeight: "600",
  },

  ad: {
    margin: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
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
