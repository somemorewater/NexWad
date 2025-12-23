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
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Product() {
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
          Product
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* PRODUCT IMAGE */}
        <Image
          source={{ uri: "https://picsum.photos/600/600" }}
          style={styles.productImage}
        />

        {/* PRODUCT INFO */}
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.text }]}>
            Physics Textbook (New)
          </Text>

          <Text style={styles.price}>₦3,500</Text>

          <Text style={[styles.desc, { color: theme.sub }]}>
            Clean copy, no missing pages. Perfect for first year students.
          </Text>
        </View>

        {/* SELLER */}  <TouchableOpacity  onPress={() => router.push("/seller")}
>  
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sellerRow}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=8" }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: theme.text }]}>
                Campus Bookstore
              </Text>
              <Text style={{ color: theme.sub }}>
                ⭐ 4.8 · Trusted Seller
              </Text>
            </View>
            <TouchableOpacity>
              <Feather name="chevron-right" size={20} color={theme.sub} />
            </TouchableOpacity>
          </View>
        </View>


        </TouchableOpacity>
      
        {/* SPONSORED TAG */}
        <View style={styles.sponsoredWrap}>
          <Text style={styles.sponsored}>Sponsored Product</Text>
        </View>
      </ScrollView>

      {/* ACTION BAR */}
      <View style={[styles.actionBar, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => router.push("/message")}  style={styles.messageBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#1D9BF0" />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity  style={styles.buyBtn}>
          <Text style={styles.buyText}>Add to cart</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM NAV */}
      <View style={[styles.nav, { borderColor: theme.border, backgroundColor: theme.bg }]}>
        <NavIcon icon="home" onPress={() => router.push("/home")} />
        <NavIcon icon="search" onPress={() => router.push("/discover")} />
        <NavIcon icon="shopping-bag" active />
        <NavIcon icon="user" onPress={() => router.push("/profile")} />
      </View>
    </SafeAreaView>
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

/* ================= STYLES ================= */

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

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  productImage: {
    width: "100%",
    height: 320,
  },

  section: {
    padding: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
  },

  price: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "800",
    color: "#1D9BF0",
  },

  desc: {
    marginTop: 8,
    lineHeight: 20,
  },

  card: {
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
  },

  sellerName: {
    fontWeight: "700",
  },

  sponsoredWrap: {
    margin: 14,
  },

  sponsored: {
    color: "#1D9BF0",
    fontSize: 12,
    fontWeight: "600",
  },

  actionBar: {
    position: "absolute",
    bottom: 64,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    gap: 10,
  },

  messageBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1D9BF0",
    borderRadius: 24,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  messageText: {
    color: "#1D9BF0",
    fontWeight: "700",
  },

  buyBtn: {
    flex: 1,
    backgroundColor: "#1D9BF0",
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: "center",
  },

  buyText: {
    color: "#fff",
    fontWeight: "700",
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
