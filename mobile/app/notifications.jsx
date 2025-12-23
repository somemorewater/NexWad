import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Notifications() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>

        <Text style={styles.title}>Notifications</Text>

        <View style={{ width: 22 }} />
      </View>

      {/* LIST */}
      <ScrollView>
        <NotificationItem
          avatar="https://i.pravatar.cc/150?img=12"
          title="New message"
          text="Seller @campusstore sent you a message."
          time="2m ago"
          onPress={() => router.push("/messages")}
        />

        <NotificationItem
          icon="shopping-bag"
          title="Order update"
          text="Your order for Scientific Calculator is confirmed."
          time="10m ago"
          onPress={() => router.push("/orders")}
        />

        <NotificationItem
          icon="heart"
          title="Someone liked your post"
          text="@realDaz liked your post."
          time="1h ago"
        />

        <NotificationItem
          icon="tag"
          title="Price drop"
          text="Physics Textbook just dropped in price."
          time="3h ago"
          onPress={() => router.push("/product")}
        />

        <NotificationItem
          icon="shield"
          title="Account verified"
          text="Your student account has been verified."
          time="Yesterday"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= ITEM ================= */
function NotificationItem({
  avatar,
  icon,
  title,
  text,
  time,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.iconWrap}>
          <Feather name={icon} size={18} color="#1D9BF0" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemText}>{text}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginTop:20,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
  },

  item: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F3FD",
    alignItems: "center",
    justifyContent: "center",
  },

  itemTitle: {
    fontWeight: "700",
    fontSize: 14,
  },

  itemText: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },

  time: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
});
