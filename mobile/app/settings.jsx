import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function Settings() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView>
        {/* ACCOUNT */}
        <Section title="Account">
          <Item label="Edit Profile" onPress={() => router.push("/edit-profile")} />
          <Item label="Verification Status" onPress={() => router.push("/verification")} />
          <Item label="Change Password" />
        </Section>

        {/* PREFERENCES */}
        <Section title="Preferences">
          <Item label="Notifications" />
          <Item label="Privacy & Security" />
        </Section>

        {/* SUPPORT */}
        <Section title="Support">
          <Item label="Help Center" />
          <Item label="Report a Problem" />
          <Item label="About Bluebase" />
        </Section>

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

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Item({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
      <Feather name="chevron-right" size={18} color="#999" />
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 13,
    color: "#888",
    marginLeft: 14,
    marginBottom: 6,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  itemText: {
    fontSize: 15,
  },

  logout: {
    marginTop: 30,
    alignItems: "center",
    padding: 16,
  },

  logoutText: {
    color: "red",
    fontWeight: "700",
  },
});
