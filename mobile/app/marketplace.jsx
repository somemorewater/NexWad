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

export default function Marketplace() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const [tab, setTab] = useState("market");

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
        <Text style={[styles.logo, { color: theme.text }]}>Marketplace</Text>
      </View>

      {/* TOP TABS */}
      <View style={[styles.tabs, { borderColor: theme.border }]}>
        <TabButton
          label="Market"
          active={tab === "market"}
          onPress={() => setTab("market")}
        />
        <TabButton
          label="Lost & Found"
          active={tab === "lost"}
          onPress={() => setTab("lost")}
        />
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {tab === "market" ? (
          <>
            <ProductCard
              theme={theme}
              title="Scientific Calculator"
              price="₦9,800"
              seller="Daz Stores"
              rating={4.5}
            />

            <ProductCard
              theme={theme}
              title="Physics Textbook"
              price="₦4,500"
              seller="StudyHub NG"
              rating={4.8}
            />

            <SponsoredAd theme={theme} />

            <ProductCard
              theme={theme}
              title="Laptop Cooling Pad"
              price="₦6,200"
              seller="Tech Plug"
              rating={4.2}
            />
          </>
        ) : (
          <>
            <LostItem
              theme={theme}
              title="Lost Student ID Card"
              location="Faculty of Science"
            />

            <LostItem
              theme={theme}
              title="Found USB Flash Drive"
              location="Library"
            />

            <SponsoredAd theme={theme} />
          </>
        )}
      </ScrollView>

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

/* ================= TAB BUTTON ================= */
function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabBtn,
        active && styles.tabActive,
      ]}
    >
      <Text
        style={{
          color: active ? "#1D9BF0" : "#888",
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ================= PRODUCT ================= */
function ProductCard({ title, price, seller, rating, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Image
        source={{ uri: "https://picsum.photos/400" }}
        style={styles.productImage}
      />

      <Text style={[styles.productTitle, { color: theme.text }]}>{title}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.price}>{price}</Text>
        <Stars rating={rating} />
      </View>

      <Text style={{ color: theme.sub, fontSize: 12 }}>
        Seller: {seller}
      </Text>

      <TouchableOpacity onPress={() => router.push("/product")} style={styles.buyBtn}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STARS ================= */
function Stars({ rating }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Feather name="star" size={14} color="#FFD700" />
      <Text style={{ marginLeft: 4, fontSize: 12 }}>{rating}</Text>
    </View>
  );
}

/* ================= AD ================= */
function SponsoredAd({ theme }) {
  return (
    <View style={[styles.ad, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={styles.sponsored}>Sponsored</Text>
      <Text style={{ color: theme.text, fontWeight: "700", marginTop: 4 }}>
        Promote your product on Bluebase
      </Text>
      <Text style={{ color: theme.sub }}>
        Reach thousands of students daily
      </Text>
    </View>
  );
}

/* ================= LOST ITEM ================= */
function LostItem({ title, location, theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.productTitle, { color: theme.text }]}>{title}</Text>
      <Text style={{ color: theme.sub }}>Location: {location}</Text>

      <TouchableOpacity style={styles.outlineBtn}>
        <Text style={{ color: "#1D9BF0", fontWeight: "600" }}>
          Contact
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= NAV ================= */
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

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },

  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#1D9BF0",
  },

  card: {
    margin: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  productImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },

  productTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    color: "#1D9BF0",
    fontWeight: "700",
  },

  buyBtn: {
    backgroundColor: "#1D9BF0",
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },

  sponsored: {
    color: "#1D9BF0",
    fontSize: 12,
    fontWeight: "600",
  },

  ad: {
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  outlineBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1D9BF0",
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
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
