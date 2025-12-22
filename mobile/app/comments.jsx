import { View, Text, StyleSheet, ScrollView, Image, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function Comments() {
  const { name, username, text } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="arrow-left" size={22} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Original Post */}
        <View style={styles.post}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?u=" + username }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.text}>{text}</Text>
          </View>
        </View>

        {/* Replies */}
        <Reply name="Blessing" text="This is facts 😂🔥" />
        <Reply name="Tunde" text="Bluebase actually clean ngl" />
        <Reply name="Aisha" text="Waiting for dark mode 👀" />
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          placeholder="Post your reply"
          style={styles.input}
        />
      </View>
    </View>
  );
}

/* ===== REPLY ===== */
function Reply({ name, text }) {
  return (
    <View style={styles.reply}>
      <Image
        source={{ uri: "https://i.pravatar.cc/150?u=" + name }}
        style={styles.replyAvatar}
      />
      <View>
        <Text style={styles.replyName}>{name}</Text>
        <Text style={styles.replyText}>{text}</Text>
      </View>
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  content: {
    padding: 14,
    paddingBottom: 80,
  },

  post: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  name: {
    fontWeight: "700",
  },

  username: {
    fontSize: 12,
    color: "#666",
  },

  text: {
    marginTop: 6,
    fontSize: 14,
  },

  reply: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  replyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  replyName: {
    fontWeight: "600",
    fontSize: 13,
  },

  replyText: {
    fontSize: 13,
    color: "#333",
  },

  inputBar: {
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 10,
  },

  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
});
