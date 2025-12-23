import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const isSeller = true; // later from backend

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={styles.avatar}
          />

          <View style={styles.nameRow}>
            <Text style={styles.name}>Daz</Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#1D9BF0"
            />
          </View>

          <Text style={styles.username}>@realDaz</Text>

          <Text style={styles.bio}>
            Building, learning and selling useful things on campus.
          </Text>

          {/* ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.primaryText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/saved")}
            >
              <Feather name="bookmark" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat title="Posts" value="24" />
          <Stat title="Followers" value="1.2k" />
          <Stat title="Following" value="180" />
          {isSeller && <Stat title="⭐ Rating" value="4.8" />}
        </View>

        {/* SELLER SECTION */}
        {isSeller && (
          <>
            <Text style={styles.sectionTitle}>Products</Text>

            <ProductCard title="Physics Textbook" price="₦3,500" />
            <ProductCard title="Calculator" price="₦12,000" />
          </>
        )}

        {/* POSTS */}
        <Text style={styles.sectionTitle}>Posts</Text>

        <Post text="Selling original textbooks, DM if interested." />
        <Post text="Any tips for PHY 106 exam? 🤔" />

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logout}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Stat({ title, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function ProductCard({ title, price }) {
  return (
    <TouchableOpacity style={styles.product}>
      <View>
        <Text style={styles.productTitle}>{title}</Text>
        <Text style={styles.productPrice}>{price}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );
}

function Post({ text }) {
  return (
    <View style={styles.post}>
      <Text style={styles.postText}>{text}</Text>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
     marginTop:20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  profileSection: {
    alignItems: "center",
    padding: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
  },

  username: {
    color: "#666",
    marginTop: 2,
  },

  bio: {
    textAlign: "center",
    marginTop: 10,
    color: "#444",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  primaryBtn: {
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    borderRadius: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  stat: {
    alignItems: "center",
  },

  statValue: {
    fontWeight: "800",
    fontSize: 16,
  },

  statTitle: {
    fontSize: 12,
    color: "#666",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 14,
  },

  product: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  productTitle: {
    fontWeight: "600",
  },

  productPrice: {
    color: "#1D9BF0",
    marginTop: 4,
  },

  post: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  postText: {
    color: "#333",
  },

  logout: {
    marginTop: 30,
    alignItems: "center",
    padding: 14,
  },

  logoutText: {
    color: "red",
    fontWeight: "700",
  },
});
