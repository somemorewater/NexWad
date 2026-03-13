// app/(tabs)/notifications.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const ICON_MAP = {
  like:    { icon: "heart",            iconBg: "#FEF2F2", iconColor: "#EF4444" },
  message: { icon: "chatbubble",       iconBg: "#EFF6FF", iconColor: "#1E3A8A" },
  sale:    { icon: "bag-check",        iconBg: "#F0FDF4", iconColor: "#15803D" },
  follow:  { icon: "person-add",       iconBg: "#EDE9FE", iconColor: "#4C1D95" },
  promo:   { icon: "pricetag",         iconBg: "#FFF7ED", iconColor: "#F97316" },
  review:  { icon: "star",             iconBg: "#FEF9C3", iconColor: "#B45309" },
  comment: { icon: "chatbubble",       iconBg: "#EFF6FF", iconColor: "#1E3A8A" },
  system:  { icon: "shield-checkmark", iconBg: "#F0FDF4", iconColor: "#15803D" },
  order:   { icon: "cube",             iconBg: "#F0FDF4", iconColor: "#15803D" },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const NotifItem = ({ item, index, onPress }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const meta = ICON_MAP[item.type] || ICON_MAP.system;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay:index*45, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay:index*45, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity
        style={[s.item, !item.read && s.itemUnread]}
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        <View style={[s.iconWrap, { backgroundColor: meta.iconBg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.iconColor} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[s.itemTitle, !item.read && s.itemTitleUnread]}>{item.title}</Text>
          <Text style={s.itemBody} numberOfLines={1}>{item.body || item.message}</Text>
          <Text style={s.itemTime}>{item.createdAt ? timeAgo(item.createdAt) : item.time}</Text>
        </View>
        {!item.read && <View style={s.unreadDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Notifications() {
  const [notifs,      setNotifs]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      setNotifs(data.notifications || data || []);
    } catch (err) {
      console.log("[notifications error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.notifications.readAll(); } catch {}
  };

  const handlePress = async (item) => {
    setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    try { await api.notifications.read(item.id); } catch {}

    if      (item.type === "message") router.push("/(tabs)/messages");
    else if (item.type === "sale")    router.push("/(tabs)/orders");
    else if (item.type === "order")   router.push("/(tabs)/orders");
    else if (item.type === "follow")  router.push("/(tabs)/profile");
    else if (item.type === "like" && item.listingId) router.push(`/(tabs)/listing/${item.listingId}`);
    else if (item.type === "review")  router.push("/(tabs)/all-reviews");
    else if (item.type === "promo")   router.push("/(tabs)/marketplace");
    else if (item.type === "system")  router.push("/(tabs)/verification");
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <View style={s.countPill}><Text style={s.countTxt}>{unreadCount}</Text></View>}
        </View>
        {unreadCount > 0
          ? <TouchableOpacity onPress={markAllRead}><Text style={s.markAll}>Mark all read</Text></TouchableOpacity>
          : <View style={{ width:80 }} />
        }
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim }}>
        <FlatList
          data={notifs}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#F97316"]} />}
          renderItem={({ item, index }) => (
            <NotifItem item={item} index={index} onPress={handlePress} />
          )}
          ListEmptyComponent={
            !loading && (
              <View style={s.empty}>
                <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyTitle}>No notifications yet</Text>
                <Text style={s.emptySub}>We'll let you know when something happens</Text>
              </View>
            )
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerCenter: { flexDirection:"row", alignItems:"center", gap:8 },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  countPill: { backgroundColor:"#F97316", borderRadius:10, minWidth:20, height:20, alignItems:"center", justifyContent:"center", paddingHorizontal:6 },
  countTxt: { fontSize:11, fontWeight:"900", color:"#fff" },
  markAll: { fontSize:13, fontWeight:"600", color:"#F97316" },
  item: { flexDirection:"row", alignItems:"center", gap:13, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  itemUnread: { backgroundColor:"#FAFBFF" },
  iconWrap: { width:44, height:44, borderRadius:22, alignItems:"center", justifyContent:"center" },
  itemTitle: { fontSize:13, fontWeight:"500", color:"#374151", marginBottom:2 },
  itemTitleUnread: { fontWeight:"700", color:"#111827" },
  itemBody: { fontSize:12, color:"#9CA3AF", marginBottom:3 },
  itemTime: { fontSize:11, color:"#C4C4C4" },
  unreadDot: { width:8, height:8, borderRadius:4, backgroundColor:"#F97316" },
  empty: { alignItems:"center", justifyContent:"center", paddingTop:80, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
});