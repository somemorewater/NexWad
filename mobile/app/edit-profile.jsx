import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function EditProfile() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* AVATAR */}
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=12" }}
          style={styles.avatar}
        />
        <TouchableOpacity>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="Your name" />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell people about you"
          multiline
        />

        <Text style={styles.label}>Phone / Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          keyboardType="phone-pad"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginTop:20,
  },

  title: {
    fontWeight: "700",
    fontSize: 16,
  },

  save: {
    color: "#1D9BF0",
    fontWeight: "700",
  },

  avatarWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  changePhoto: {
    color: "#1D9BF0",
    marginTop: 10,
    fontWeight: "600",
  },

  form: {
    paddingHorizontal: 16,
  },

  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
});
