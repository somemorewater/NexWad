// app/seller-dashboard.jsx
import React, { useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STATS = [
  { label:"Total Sales",    value:"₦84,500",  icon:"cash-outline",       bg:"#F0FDF4", color:"#15803D", change:"+12%", up:true  },
  { label:"Orders",         value:"38",        icon:"bag-check-outline",  bg:"#EFF6FF", color:"#1E3A8A", change:"+5",   up:true  },
  { label:"Active Listings",value:"4",         icon:"grid-outline",       bg:"#FFF7ED", color:"#EA580C", change:"",     up:null  },
  { label:"Profile Views",  value:"312",       icon:"eye-outline",        bg:"#EDE9FE", color:"#4C1D95", change:"+28%", up:true  },
];

const RECENT_ORDERS = [
  { id:"do1", title:"Stroud Maths 7th Ed",   buyer:"Ngozi A.", amount:"₦4,500", status:"delivered", time:"2d ago" },
  { id:"do2", title:"Python Tutoring x2",    buyer:"Tunde A.", amount:"₦5,000", status:"completed", time:"4d ago" },
  { id:"do3", title:"Engineering Drawing Set",buyer:"Amaka O.",amount:"₦3,800", status:"pending",   time:"Today"  },
];

const StatCard = ({ item, index }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[SC.card, { opacity:fa, transform:[{translateY:sa}] }]}>
      <View style={[SC.iconWrap, { backgroundColor:item.bg }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={SC.value}>{item.value}</Text>
      <Text style={SC.label}>{item.label}</Text>
      {item.change ? (
        <View style={[SC.changePill, { backgroundColor: item.up ? "#F0FDF4" : "#FEF2F2" }]}>
          <Ionicons name={item.up ? "trending-up" : "trending-down"} size={10} color={item.up ? "#15803D" : "#DC2626"} />
          <Text style={[SC.changeTxt, { color: item.up ? "#15803D" : "#DC2626" }]}>{item.change}</Text>
        </View>
      ) : <View style={{ height:20 }} />}
    </Animated.View>
  );
};
const SC = StyleSheet.create({
  card: { width:"47%", backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2, marginBottom:14 },
  iconWrap: { width:40, height:40, borderRadius:12, alignItems:"center", justifyContent:"center", marginBottom:10 },
  value: { fontSize:22, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  label: { fontSize:11, color:"#9CA3AF", marginTop:2, marginBottom:6 },
  changePill: { flexDirection:"row", alignItems:"center", gap:3, alignSelf:"flex-start", paddingHorizontal:7, paddingVertical:3, borderRadius:8 },
  changeTxt: { fontSize:10, fontWeight:"700" },
});

export default function SellerDashboard() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;

  // Mock: in production derive from seller's actual data
  const isNewSeller = false; // flip to true to see empty state

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:450, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:450, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Seller Dashboard</Text>
        <TouchableOpacity onPress={() => router.push("/new-listing")}>
          <Ionicons name="add-circle-outline" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
      >
        {/* Greeting */}
        <View style={s.greetCard}>
          <View>
            <Text style={s.greetSub}>Welcome back,</Text>
            <Text style={s.greetName}>Adaeze 👋</Text>
          </View>
          <View style={s.ratingChip}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={s.ratingTxt}>4.9 seller rating</Text>
          </View>
        </View>

        {/* Stats grid */}
        <Text style={s.sectionLabel}>This Month</Text>
        <View style={s.statsGrid}>
          {STATS.map((stat, i) => <StatCard key={stat.label} item={stat} index={i} />)}
        </View>

        {/* Quick actions */}
        <Text style={s.sectionLabel}>Quick Actions</Text>
        <View style={s.actionGrid}>
          {[
            { icon:"add-circle-outline",    label:"New Listing",      route:"/new-listing",       bg:"#FFF7ED", color:"#EA580C" },
            { icon:"grid-outline",           label:"My Listings",      route:"/my-listings",       bg:"#EFF6FF", color:"#1E3A8A" },
            { icon:"analytics-outline",      label:"Analytics",        route:"/analytics",         bg:"#EDE9FE", color:"#4C1D95" },
            { icon:"cube-outline",           label:"My Orders",        route:"/orders",            bg:"#F0FDF4", color:"#15803D" },
            { icon:"pin-outline",            label:"Pin Listing",      route:"/pin-listing",       bg:"#DCFCE7", color:"#15803D" },
            { icon:"megaphone-outline",      label:"Promote",          route:"/pro",               bg:"#FEF9C3", color:"#B45309" },
          ].map(action => (
            <TouchableOpacity key={action.label} style={s.actionCard} onPress={() => router.push(action.route)}>
              <View style={[s.actionIcon, { backgroundColor:action.bg }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent orders */}
        <View style={s.recentHeader}>
          <Text style={s.sectionLabel}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push("/orders")}>
            <Text style={s.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {isNewSeller ? (
          <View style={s.emptyCard}>
            <Ionicons name="bag-outline" size={34} color="#D1D5DB" />
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySub}>Orders will appear here once buyers purchase your listings.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/new-listing")}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={s.emptyBtnTxt}>Post your first listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          RECENT_ORDERS.map(order => {
            const STATUS = {
              delivered: { bg:"#F0FDF4", color:"#15803D", label:"Delivered" },
              completed: { bg:"#EFF6FF", color:"#1E3A8A", label:"Completed" },
              pending:   { bg:"#FEF9C3", color:"#B45309", label:"Pending"   },
            };
            const st = STATUS[order.status];
            return (
              <TouchableOpacity key={order.id} style={s.orderRow} onPress={() => router.push(`/order/${order.id}`)}>
                <View style={s.orderIcon}>
                  <Ionicons name="bag-handle-outline" size={18} color="#1E3A8A" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.orderTitle} numberOfLines={1}>{order.title}</Text>
                  <Text style={s.orderBuyer}>from {order.buyer} · {order.time}</Text>
                </View>
                <View style={{ alignItems:"flex-end", gap:4 }}>
                  <Text style={s.orderAmount}>{order.amount}</Text>
                  <View style={[s.orderStatus, { backgroundColor:st.bg }]}>
                    <Text style={[s.orderStatusTxt, { color:st.color }]}>{st.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Upgrade nudge */}
        <TouchableOpacity style={s.proCard} onPress={() => router.push("/pro")}>
          <View style={s.proLeft}>
            <Ionicons name="sparkles" size={20} color="#FCD34D" />
            <View>
              <Text style={s.proTitle}>Upgrade to Pro</Text>
              <Text style={s.proSub}>Promote listings · Zero commission · More analytics</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  greetCard: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:20, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  greetSub: { fontSize:12, color:"#9CA3AF" },
  greetName: { fontSize:22, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  ratingChip: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FEF9C3", paddingHorizontal:10, paddingVertical:6, borderRadius:14 },
  ratingTxt: { fontSize:12, fontWeight:"700", color:"#B45309" },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  statsGrid: { flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between" },
  actionGrid: { flexDirection:"row", flexWrap:"wrap", gap:12, marginBottom:20 },
  actionCard: { width:"47%", backgroundColor:"#fff", borderRadius:18, padding:14, alignItems:"center", gap:8, borderWidth:1, borderColor:"#F3F4F6" },
  actionIcon: { width:48, height:48, borderRadius:16, alignItems:"center", justifyContent:"center" },
  actionLabel: { fontSize:12, fontWeight:"700", color:"#374151" },
  recentHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  seeAll: { fontSize:13, fontWeight:"600", color:"#1E3A8A" },
  emptyCard: { backgroundColor:"#fff", borderRadius:18, padding:24, alignItems:"center", gap:10, borderWidth:1, borderColor:"#F3F4F6", marginBottom:14 },
  emptyTitle: { fontSize:15, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:12, color:"#9CA3AF", textAlign:"center", lineHeight:18 },
  emptyBtn: { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#1E3A8A", paddingHorizontal:16, paddingVertical:10, borderRadius:14, marginTop:4 },
  emptyBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
  orderRow: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:16, padding:13, marginBottom:10, borderWidth:1, borderColor:"#F3F4F6" },
  orderIcon: { width:40, height:40, borderRadius:12, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  orderTitle: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:2 },
  orderBuyer: { fontSize:11, color:"#9CA3AF" },
  orderAmount: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  orderStatus: { paddingHorizontal:8, paddingVertical:2, borderRadius:8 },
  orderStatusTxt: { fontSize:10, fontWeight:"700" },
  proCard: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#1E3A8A", borderRadius:20, padding:16, marginTop:8 },
  proLeft: { flexDirection:"row", alignItems:"center", gap:12, flex:1 },
  proTitle: { fontSize:14, fontWeight:"800", color:"#fff" },
  proSub: { fontSize:11, color:"#93C5FD", marginTop:2 },
});
