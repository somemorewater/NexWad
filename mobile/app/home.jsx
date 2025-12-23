import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Feather name="menu" size={22} />
        </TouchableOpacity>

        <Text style={styles.logo}>Bluebase</Text>

        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Feather name="bell" size={20} />
        </TouchableOpacity>
      </View>

      {/* FEED */}
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <Post name="Daz" username="@realDaz" text="Selling my old physics textbooks — clean & affordable." />
        <Post name="Blessing" username="@bee" text="Marketplace ads on Bluebase are actually useful fr." />

        <AdCard />

        <Post name="Tunde" username="@tundedev" text="If you’re a student seller, this app is a win." />
        <SponsoredProduct />

        <Post name="Aisha" username="@ai.shah" text="Looking for a calculator before exams 😭" />
        <Post name="Jamal" username="@jamal_talks" text="Bluebase ads don’t feel spammy. That’s rare." />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.nav}>
        <NavIcon icon="home" active />
        <NavIcon icon="search" onPress={() => router.push("/discover")} />
        <NavIcon icon="shopping-bag" onPress={() => router.push("/marketplace")} />
        <NavIcon icon="user" onPress={() => router.push("/profile")} />
      </View>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <TouchableOpacity onPress={() => setSidebarOpen(false)} style={styles.closeBtn}>
              <Feather name="x" size={20} />
            </TouchableOpacity>

            <SideItem icon="shopping-cart" label="Cart" onPress={() => router.push("/cart")} />
            <SideItem icon="bell" label="Notifications" onPress={() => router.push("/notifications")} />
            <SideItem icon="user" label="Profile" onPress={() => router.push("/profile")} />
          </View>

          <TouchableOpacity style={styles.overlay} onPress={() => setSidebarOpen(false)} />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= POST ================= */
function Post({ name, username, text }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?u=" + username }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>{username}</Text>

          <Text style={styles.postText}>{text}</Text>

          <View style={styles.actions}>
            <Feather name="message-circle" size={18} color="#666" />
            <TouchableOpacity onPress={() => setLiked(!liked)}>
              <Feather name="heart" size={18} color={liked ? "red" : "#666"} />
            </TouchableOpacity>
            <Feather name="share" size={18} color="#666" />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ================= AD ================= */
function AdCard() {
  return (
    <View style={styles.ad}>
      <Text style={styles.sponsored}>Sponsored</Text>

      <Image
        source={{ uri: "https://picsum.photos/600/400" }}
        style={styles.adImage}
      />

      <Text style={styles.adTitle}>Physics Textbook (2025 Edition)</Text>
      <Text style={styles.sub}>Trusted by 5k+ students</Text>

      <View style={styles.adRow}>
        <Text style={styles.price}>₦4,500</Text>
        <TouchableOpacity
          style={styles.adButton}
          onPress={() => router.push("/product")}
        >
          <Text style={styles.adBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= SPONSORED PRODUCT ================= */
function SponsoredProduct() {
  return (
    <View style={styles.card}>
      <Text style={styles.sponsored}>Sponsored Product</Text>

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <Image
          source={{ uri: "https://picsum.photos/200" }}
          style={styles.productThumb}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name}>Scientific Calculator</Text>
          <Text style={styles.sub}>Exam approved</Text>

          <View style={styles.adRow}>
            <Text style={styles.price}>₦9,800</Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push("/product")}
            >
              <Text style={styles.outlineText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ================= NAV ICON ================= */
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

/* ================= SIDEBAR ITEM ================= */
function SideItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.sideItem} onPress={onPress}>
      <Feather name={icon} size={20} />
      <Text style={styles.sideText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginTop:20,
  },

  logo: { fontSize: 20, fontWeight: "800" },

  card: {
    margin: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  row: { flexDirection: "row", gap: 10 },

  avatar: { width: 42, height: 42, borderRadius: 21 },

  name: { fontWeight: "700" },
  username: { fontSize: 12, color: "#666" },
  postText: { marginTop: 6, fontSize: 14 },

  actions: { marginTop: 10, flexDirection: "row", gap: 20 },

  sponsored: { color: "#1D9BF0", fontSize: 12, fontWeight: "600" },

  ad: {
    margin: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  adImage: { width: "100%", height: 160, borderRadius: 10, marginTop: 8 },
  adTitle: { marginTop: 8, fontSize: 16, fontWeight: "700" },
  sub: { color: "#666" },

  adRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: { color: "#1D9BF0", fontWeight: "700" },

  adButton: {
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  adBtnText: { color: "#fff", fontWeight: "600" },

  productThumb: { width: 80, height: 80, borderRadius: 10 },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#1D9BF0",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },

  outlineText: { color: "#1D9BF0", fontWeight: "600" },

  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  sidebarOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },

  sidebar: {
    width: 260,
    backgroundColor: "#fff",
    padding: 16,
    borderRightWidth: 1,
    borderColor: "#eee",
  },

  closeBtn: { alignSelf: "flex-end", marginBottom: 20 },

  sideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },

  sideText: { fontSize: 16, fontWeight: "600" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
});
