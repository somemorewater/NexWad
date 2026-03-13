// app/buyer-analytics.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

const PERIODS = ["7 days", "30 days", "3 months"];

const OVERVIEW = {
  "7 days":   { saved:12, viewed:48,  purchased:3,  spent:"₦12,400", avgOrder:"₦4,133" },
  "30 days":  { saved:41, viewed:184, purchased:11, spent:"₦48,200", avgOrder:"₦4,382" },
  "3 months": { saved:98, viewed:420, purchased:28, spent:"₦118,500",avgOrder:"₦4,232" },
};

const CATEGORIES_SPENT = [
  { label:"Textbooks",   amount:22400, pct:46, color:"#1E3A8A", bg:"#EFF6FF" },
  { label:"Electronics", amount:14800, pct:30, color:"#F97316", bg:"#FFF7ED" },
  { label:"Services",    amount:7200,  pct:15, color:"#4C1D95", bg:"#EDE9FE" },
  { label:"Food",        amount:4300,  pct:9,  color:"#15803D", bg:"#F0FDF4" },
];

const RECENT_ACTIVITY = [
  { id:"a1", type:"purchase", title:"Stroud Maths 7th Ed",          seller:"Ada O.",    amount:"₦4,500", time:"2d ago",  icon:"bag-check-outline",  iconBg:"#F0FDF4",  iconColor:"#15803D" },
  { id:"a2", type:"save",     title:"HP 65W USB-C Charger",          seller:"Emeka B.",  amount:"₦6,000", time:"3d ago",  icon:"bookmark-outline",   iconBg:"#EFF6FF",  iconColor:"#1E3A8A" },
  { id:"a3", type:"purchase", title:"Python Tutoring — 1hr",         seller:"Chuks E.",  amount:"₦3,000", time:"5d ago",  icon:"bag-check-outline",  iconBg:"#F0FDF4",  iconColor:"#15803D" },
  { id:"a4", type:"save",     title:"Casio fx-991EX Calculator",     seller:"Ngozi A.",  amount:"₦5,500", time:"1wk ago", icon:"bookmark-outline",   iconBg:"#EFF6FF",  iconColor:"#1E3A8A" },
  { id:"a5", type:"purchase", title:"Jollof Rice + Protein x3",      seller:"Fatima Y.", amount:"₦2,400", time:"1wk ago", icon:"bag-check-outline",  iconBg:"#F0FDF4",  iconColor:"#15803D" },
  { id:"a6", type:"view",     title:"Engineering Drawing Set",       seller:"Tunde A.",  amount:"₦3,800", time:"2wk ago", icon:"eye-outline",        iconBg:"#F3F4F6",  iconColor:"#6B7280" },
];

const SAVED_NOT_BOUGHT = [
  { id:"s1", title:"HP 65W USB-C Charger",      price:"₦6,000", seller:"Emeka B.",  savedDays:3,  icon:"flash-outline",      iconBg:"#FEF9C3", iconColor:"#854D0E" },
  { id:"s2", title:"Casio fx-991EX Calculator", price:"₦5,500", seller:"Ngozi A.",  savedDays:7,  icon:"calculator-outline", iconBg:"#F0F9FF", iconColor:"#0369A1" },
  { id:"s3", title:"Engineering Drawing Set",   price:"₦3,800", seller:"Tunde A.",  savedDays:14, icon:"pencil-outline",     iconBg:"#EDE9FE", iconColor:"#4C1D95" },
];

const AnimBar = ({ pct, color, delay }) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue:pct, duration:700, delay, useNativeDriver:false }).start();
  }, [pct]);
  return (
    <Animated.View style={[ab.bar, {
      width: w.interpolate({ inputRange:[0,100], outputRange:["0%","100%"] }),
      backgroundColor: color,
    }]} />
  );
};
const ab = StyleSheet.create({ bar: { height:8, borderRadius:4 } });

const BuyerStatCard = ({ stat, index }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:380, delay:index*70, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:380, delay:index*70, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.statCard, { opacity:fa, transform:[{translateY:sa}] }]}>
      <View style={[s.statIcon, { backgroundColor:stat.bg }]}>
        <Ionicons name={stat.icon} size={17} color={stat.color} />
      </View>
      <Text style={s.statValue}>{stat.value}</Text>
      <Text style={s.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
};

export default function BuyerAnalytics() {
  const [period, setPeriod] = useState("30 days");
  const [tab,    setTab]    = useState("overview");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const ov = OVERVIEW[period];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>My Spending</Text>
          <Text style={s.headerSub}>Premium Buyer Dashboard</Text>
        </View>
        <View style={s.premiumBadge}>
          <Ionicons name="diamond" size={12} color="#FCD34D" />
          <Text style={s.premiumTxt}>Premium</Text>
        </View>
      </View>

      {/* Period tabs */}
      <View style={s.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.periodBtn, period === p && s.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Stat cards */}
          <View style={s.statsGrid}>
            {[
              { label:"Total Spent",    value:ov.spent,     icon:"cash-outline",      bg:"#F0FDF4", color:"#15803D" },
              { label:"Avg. Order",     value:ov.avgOrder,  icon:"receipt-outline",   bg:"#EFF6FF", color:"#1E3A8A" },
              { label:"Purchases",      value:ov.purchased, icon:"bag-check-outline", bg:"#FFF7ED", color:"#EA580C" },
              { label:"Items Saved",    value:ov.saved,     icon:"bookmark-outline",  bg:"#EDE9FE", color:"#4C1D95" },
            ].map((stat, i) => (
              <BuyerStatCard key={stat.label} stat={stat} index={i} />
            ))}
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            {["overview","activity","saved"].map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tab, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                  {t === "overview" ? "Breakdown" : t === "activity" ? "Activity" : "Saved Items"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Spending by Category</Text>
              {CATEGORIES_SPENT.map((cat, i) => (
                <View key={cat.label} style={s.catRow}>
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />
                  <View style={{ flex:1, gap:6 }}>
                    <View style={s.catTop}>
                      <Text style={s.catLabel}>{cat.label}</Text>
                      <Text style={s.catAmount}>₦{cat.amount.toLocaleString()}</Text>
                    </View>
                    <View style={s.barTrack}>
                      <AnimBar pct={cat.pct} color={cat.color} delay={i * 80} />
                    </View>
                  </View>
                  <Text style={s.catPct}>{cat.pct}%</Text>
                </View>
              ))}

              <View style={s.divider} />
              <Text style={s.sectionTitle}>Buying Habits</Text>
              <View style={s.habitsGrid}>
                {[
                  { label:"Most active day",   value:"Saturday",   icon:"calendar-outline",    bg:"#EFF6FF", color:"#1E3A8A" },
                  { label:"Peak buying time",  value:"12pm–3pm",   icon:"time-outline",         bg:"#FFF7ED", color:"#EA580C" },
                  { label:"Fav. seller",       value:"Ada O.",     icon:"person-outline",       bg:"#F0FDF4", color:"#15803D" },
                  { label:"Save-to-buy rate",  value:"27%",        icon:"trending-up-outline",  bg:"#EDE9FE", color:"#4C1D95" },
                ].map(h => (
                  <View key={h.label} style={s.habitCard}>
                    <View style={[s.habitIcon, { backgroundColor:h.bg }]}>
                      <Ionicons name={h.icon} size={16} color={h.color} />
                    </View>
                    <Text style={s.habitValue}>{h.value}</Text>
                    <Text style={s.habitLabel}>{h.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
          {tab === "activity" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              {RECENT_ACTIVITY.map(act => (
                <TouchableOpacity
                  key={act.id}
                  style={s.actCard}
                  onPress={() => router.push(`/listing/${act.id}`)}
                  activeOpacity={0.88}
                >
                  <View style={[s.actIcon, { backgroundColor:act.iconBg }]}>
                    <Ionicons name={act.icon} size={18} color={act.iconColor} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.actTitle} numberOfLines={1}>{act.title}</Text>
                    <Text style={s.actSeller}>from {act.seller} · {act.time}</Text>
                  </View>
                  <Text style={[s.actAmount, act.type !== "purchase" && s.actAmountMuted]}>
                    {act.type === "purchase" ? act.amount : act.type === "save" ? "Saved" : "Viewed"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── SAVED ITEMS TAB ──────────────────────────────────────────────── */}
          {tab === "saved" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Saved but not purchased</Text>
              <Text style={s.sectionSub}>Items you saved — tap to buy before they're gone.</Text>
              {SAVED_NOT_BOUGHT.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.savedCard}
                  onPress={() => router.push(`/listing/${item.id}`)}
                  activeOpacity={0.88}
                >
                  <View style={[s.savedIcon, { backgroundColor:item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.savedTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.savedSeller}>{item.seller}</Text>
                    <View style={s.savedDaysRow}>
                      <Ionicons name="bookmark" size={11} color="#F97316" />
                      <Text style={s.savedDaysTxt}>Saved {item.savedDays} day{item.savedDays !== 1 ? "s" : ""} ago</Text>
                    </View>
                  </View>
                  <View style={{ alignItems:"flex-end", gap:8 }}>
                    <Text style={s.savedPrice}>{item.price}</Text>
                    <TouchableOpacity style={s.buyBtn} onPress={() => router.push(`/listing/${item.id}`)}>
                      <Text style={s.buyBtnTxt}>Buy now</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Upsell if needed */}
              <View style={s.tipCard}>
                <Ionicons name="bulb-outline" size={16} color="#B45309" />
                <Text style={s.tipTxt}>Items you save can sell out fast on AFIT campus. Check back regularly!</Text>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:14, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  headerSub: { fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:1 },
  premiumBadge: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"rgba(255,255,255,0.15)", paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  premiumTxt: { fontSize:11, fontWeight:"800", color:"#FCD34D" },

  periodRow: { flexDirection:"row", gap:8, paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  periodBtn: { flex:1, paddingVertical:7, borderRadius:20, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center" },
  periodBtnActive: { backgroundColor:"#fff" },
  periodTxt: { fontSize:12, fontWeight:"600", color:"rgba(255,255,255,0.7)" },
  periodTxtActive: { color:"#1E3A8A", fontWeight:"800" },

  statsGrid: { flexDirection:"row", flexWrap:"wrap", padding:12, gap:10 },
  statCard: { width:(W-44)/2, backgroundColor:"#fff", borderRadius:18, padding:14, gap:4, borderWidth:1, borderColor:"#F3F4F6" },
  statIcon: { width:34, height:34, borderRadius:17, alignItems:"center", justifyContent:"center", marginBottom:4 },
  statValue: { fontSize:20, fontWeight:"900", color:"#111827" },
  statLabel: { fontSize:11, color:"#6B7280", fontWeight:"600" },

  tabRow: { flexDirection:"row", marginHorizontal:16, marginBottom:4, backgroundColor:"#fff", borderRadius:14, padding:3, borderWidth:1, borderColor:"#F3F4F6" },
  tab: { flex:1, paddingVertical:8, alignItems:"center", borderRadius:11 },
  tabActive: { backgroundColor:"#1E3A8A" },
  tabTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  tabTxtActive: { color:"#fff", fontWeight:"800" },

  section: { paddingHorizontal:16, paddingTop:16, gap:14 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:"#111827" },
  sectionSub: { fontSize:12, color:"#9CA3AF", marginTop:-8 },
  divider: { height:1, backgroundColor:"#F3F4F6", marginVertical:4 },

  catRow: { flexDirection:"row", alignItems:"center", gap:10 },
  catDot: { width:10, height:10, borderRadius:5 },
  catTop: { flexDirection:"row", justifyContent:"space-between" },
  catLabel: { fontSize:13, fontWeight:"600", color:"#374151" },
  catAmount: { fontSize:13, fontWeight:"800", color:"#111827" },
  barTrack: { height:8, backgroundColor:"#F3F4F6", borderRadius:4, overflow:"hidden" },
  catPct: { width:34, fontSize:11, color:"#9CA3AF", fontWeight:"700", textAlign:"right" },

  habitsGrid: { flexDirection:"row", flexWrap:"wrap", gap:10 },
  habitCard: { width:(W-52)/2, backgroundColor:"#fff", borderRadius:16, padding:14, gap:6, borderWidth:1, borderColor:"#F3F4F6" },
  habitIcon: { width:34, height:34, borderRadius:17, alignItems:"center", justifyContent:"center" },
  habitValue: { fontSize:15, fontWeight:"900", color:"#111827" },
  habitLabel: { fontSize:11, color:"#6B7280", lineHeight:15 },

  actCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  actIcon: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  actTitle: { fontSize:13, fontWeight:"700", color:"#111827" },
  actSeller: { fontSize:11, color:"#9CA3AF", marginTop:3 },
  actAmount: { fontSize:13, fontWeight:"800", color:"#15803D" },
  actAmountMuted: { color:"#9CA3AF", fontWeight:"600" },

  savedCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  savedIcon: { width:48, height:48, borderRadius:14, alignItems:"center", justifyContent:"center" },
  savedTitle: { fontSize:13, fontWeight:"700", color:"#111827" },
  savedSeller: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  savedDaysRow: { flexDirection:"row", alignItems:"center", gap:4, marginTop:4 },
  savedDaysTxt: { fontSize:11, color:"#F97316", fontWeight:"600" },
  savedPrice: { fontSize:14, fontWeight:"900", color:"#1E3A8A" },
  buyBtn: { backgroundColor:"#1E3A8A", paddingHorizontal:12, paddingVertical:6, borderRadius:10 },
  buyBtnTxt: { fontSize:11, fontWeight:"800", color:"#fff" },

  tipCard: { flexDirection:"row", alignItems:"flex-start", gap:10, backgroundColor:"#FFFBEB", borderRadius:14, padding:14, borderWidth:1, borderColor:"#FDE68A" },
  tipTxt: { flex:1, fontSize:12, color:"#B45309", lineHeight:18 },
});
