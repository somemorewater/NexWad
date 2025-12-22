import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Message() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Campus Bookstore</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* CHAT AREA */}
      <View style={styles.chatArea}>
        <Text style={styles.systemText}>
          You’re chatting with the seller
        </Text>
      </View>

      {/* INPUT */}
      <View style={styles.inputBar}>
        <TextInput
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendBtn}>
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginTop:20,
  },

  title: { fontWeight: "700", fontSize: 16 },

  chatArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  systemText: { color: "#888" },

  inputBar: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    marginRight: 8,
  },

  sendBtn: {
    backgroundColor: "#1D9BF0",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
