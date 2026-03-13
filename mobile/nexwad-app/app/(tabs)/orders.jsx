// app/(tabs)/orders.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const STATUS_MAP = {
  pending:   { label:"Pending",    icon:"time",             iconColor:"#B45309", iconBg:"#FEF9C3" },
  confirmed: { label:"Confirmed",  icon:"checkmark-circle", iconColor:"#1E3A8A", iconBg:"#EFF6FF" },
  transit:   { label:"In Transit", icon:"bicycle",          iconColor:"#1E3A8A", iconBg:"#EFF6FF" },
  delivered: { label:"Delivered",  icon:"checkmark-circle", iconColor:"#15803D", iconBg:"#F0FDF4" },
  completed: { label:"Completed",  icon:"checkmark-circle", iconColor:"#15803D", iconBg:"#F0FDF4" },
  cancelled: { label:"Cancelled",  icon:"close-circle",     iconColor:"#EF4444", iconBg:"#FEF2F2" },
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 86400)  return "Today";
  if (diff < 172800) return "Yesterday";
  if (diff < 604800) return `${Math.floor(diff/86400)} days ago`;
  return new Date(dateStr).toLocaleDateString();
};

const OrderItem = ({ item, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/(tabs)/order/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={[s.img, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="cube-outline" size={28} color="#1E3A8A" style={{ opacity:0.35 }} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.listing?.title || item.title || "Order"}</Text>
          <Text style={s.cardSeller}>from {item.seller?.name || item.listing?.seller?.name || "Seller"}</Text>
          <View style={s.cardBottom}>
            <Text style={s.cardPrice}>₦{Number(item.totalAmount || item.price || 0).toLocaleString()}</Text>
            <View style={[s.statusPill, { backgroundColor: st.iconBg }]}>
              <Ionicons name={st.icon} size={12} color={st.iconColor} />
              <Text style={[s.statusTxt, { color: st.iconColor }]}>{st.label}</Text>
            </View>
          </View>
          <Text style={s.cardDate}>{item.createdAt ? timeAgo(item.createdAt) : ""}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Orders() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const data = await api.orders.list();
      setOrders(data.orders || data || []);
    } catch (err) {
      console.log("[orders error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Orders</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim }}>
        <FlatList
          data={orders}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding:16, gap:12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#F97316"]} />}
          renderItem={({ item, index }) => <OrderItem item={item} index={index} />}
          ListEmptyComponent={
            !loading && (
              <View style={s.empty}>
                <Ionicons name="cube-outline" size={44} color="#D1D5DB" />
                <Text style={s.emptyTitle}>No orders yet</Text>
                <Text style={s.emptySub}>Orders you place will appear here</Text>
              </View>
            )
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  card: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  img: { width:60, height:60, borderRadius:14, alignItems:"center", justifyContent:"center" },
  cardTitle: { fontSize:14, fontWeight:"700", color:"#111827", marginBottom:2 },
  cardSeller: { fontSize:11, color:"#9CA3AF", marginBottom:6 },
  cardBottom: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:3 },
  cardPrice: { fontSize:14, fontWeight:"800", color:"#1E3A8A" },
  statusPill: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  statusTxt: { fontSize:10, fontWeight:"700" },
  cardDate: { fontSize:10, color:"#9CA3AF" },
  empty: { alignItems:"center", justifyContent:"center", paddingTop:80, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF" },
});