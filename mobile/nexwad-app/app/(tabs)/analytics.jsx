// app/analytics.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const PERIODS = ["7 days", "30 days", "3 months"];

const OVERVIEW = {
  "7 days":    { revenue:"₦18,200", orders:8,  views:142, saves:31,  revChange:"+14%", ordChange:"+3",  viewChange:"+22%", saveChange:"+8"  },
  "30 days":   { revenue:"₦84,500", orders:38, views:512, saves:104, revChange:"+28%", ordChange:"+12", viewChange:"+41%", saveChange:"+29" },
  "3 months":  { revenue:"₦210,000",orders:89, views:1240,saves:248, revChange:"+63%", ordChange:"+34", viewChange:"+88%", saveChange:"+71" },
};

const TOP_LISTINGS = [
  { id:"l1", title:"Stroud Engineering Maths 7th Ed",  views:124, saves:28, orders:14, revenue:"₦63,000", icon:"book-outline",       iconBg:"#DBEAFE", iconColor:"#1E3A8A", tag:"Textbooks"  },
  { id:"l2", title:"Python Tutoring Session (1hr)",    views:98,  saves:21, orders:10, revenue:"₦30,000", icon:"desktop-outline",    iconBg:"#EDE9FE", iconColor:"#4C1D95", tag:"Services"   },
  { id:"l3", title:"HP 65W USB-C Charger",             views:76,  saves:19, orders:8,  revenue:"₦48,000", icon:"flash-outline",      iconBg:"#FEF9C3", iconColor:"#854D0E", tag:"Electronics"},
  { id:"l4", title:"Casio fx-991EX Calculator",        views:54,  saves:12, orders:6,  revenue:"₦33,000", icon:"calculator-outline", iconBg:"#F0F9FF", iconColor:"#0369A1", tag:"Electronics"},
];

const WEEKLY_BARS = [
  { day:"Mon", revenue:1200, orders:1 },
  { day:"Tue", revenue:3400, orders:2 },
  { day:"Wed", revenue:2100, orders:1 },
  { day:"Thu", revenue:4800, orders:3 },
  { day:"Fri", revenue:2900, orders:2 },
  { day:"Sat", revenue:5200, orders:4 },
  { day:"Sun", revenue:1800, orders:1 },
];

const BUYER_LOCATIONS = [
  { dept:"CSC",  label:"Computer Science",    pct:34 },
  { dept:"EEE",  label:"Electrical Eng.",     pct:22 },
  { dept:"MCE",  label:"Mech. Engineering",   pct:18 },
  { dept:"CVE",  label:"Civil Engineering",   pct:14 },
  { dept:"Other",label:"Other departments",   pct:12 },
];

const BAR_COLORS = ["#1E3A8A","#3B82F6","#F97316","#15803D","#7C3AED"];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
const AnimBar = ({ pct, color, delay }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 700, delay, useNativeDriver:false }).start();
  }, [pct]);
  return (
    <Animated.View style={[b.bar, { width: widthAnim.interpolate({ inputRange:[0,100], outputRange:["0%","100%"] }), backgroundColor: color }]} />
  );
};
const b = StyleSheet.create({ bar: { height:8, borderRadius:4 } });

const StatCard = ({ label, value, change, icon, bg, color, delay }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:400, delay, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:400, delay, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.statCard, { opacity:fa, transform:[{translateY:sa}] }]}>
      <View style={[s.statIcon, { backgroundColor:bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {!!change && (
        <View style={s.statChange}>
          <Ionicons name="trending-up-outline" size={10} color="#15803D" />
          <Text style={s.statChangeTxt}>{change}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [period, setPeriod] = useState("30 days");
  const [activeTab, setActiveTab] = useState("overview");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const ov = OVERVIEW[period];
  const maxRevenue = Math.max(...WEEKLY_BARS.map(b => b.revenue));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Analytics</Text>
        <View style={{ width:24 }} />
      </View>

      {/* Period selector */}
      <View style={s.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.periodBtn, period === p && s.periodBtnActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.8}
          >
            <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* ── Overview cards ─────────────────────────────────────────────── */}
          <View style={s.statsGrid}>
            <StatCard label="Revenue"  value={ov.revenue} change={ov.revChange}  icon="cash-outline"      bg="#F0FDF4" color="#15803D" delay={0}   />
            <StatCard label="Orders"   value={ov.orders}  change={ov.ordChange}  icon="bag-check-outline" bg="#EFF6FF" color="#1E3A8A" delay={80}  />
            <StatCard label="Views"    value={ov.views}   change={ov.viewChange} icon="eye-outline"       bg="#EDE9FE" color="#4C1D95" delay={160} />
            <StatCard label="Saves"    value={ov.saves}   change={ov.saveChange} icon="bookmark-outline"  bg="#FFF7ED" color="#EA580C" delay={240} />
          </View>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <View style={s.tabRow}>
            {["overview","listings","audience"].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Revenue This Week</Text>
              <View style={s.chartWrap}>
                {WEEKLY_BARS.map((bar, i) => {
                  const heightPct = bar.revenue / maxRevenue;
                  return (
                    <View key={bar.day} style={s.barCol}>
                      <Text style={s.barRevTxt}>₦{(bar.revenue/1000).toFixed(1)}k</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { height: `${heightPct * 100}%`, backgroundColor: i === 5 ? "#F97316" : "#1E3A8A" }]} />
                      </View>
                      <Text style={s.barDayTxt}>{bar.day}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={s.divider} />

              {/* Conversion funnel */}
              <Text style={s.sectionTitle}>Conversion Funnel</Text>
              <View style={s.funnelWrap}>
                {[
                  { label:"Profile Views",  value:ov.views,  pct:100,                              color:"#1E3A8A" },
                  { label:"Listing Clicks", value:Math.round(ov.views*0.62), pct:62,               color:"#3B82F6" },
                  { label:"Saved Items",    value:ov.saves,  pct:Math.round(ov.saves/ov.views*100),color:"#F97316" },
                  { label:"Orders Placed",  value:ov.orders, pct:Math.round(ov.orders/ov.views*100),color:"#15803D" },
                ].map((row, i) => (
                  <View key={row.label} style={s.funnelRow}>
                    <View style={s.funnelLeft}>
                      <Text style={s.funnelLabel}>{row.label}</Text>
                      <Text style={s.funnelValue}>{row.value}</Text>
                    </View>
                    <View style={s.funnelBarTrack}>
                      <AnimBar pct={row.pct} color={row.color} delay={i * 100} />
                    </View>
                    <Text style={s.funnelPct}>{row.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── LISTINGS TAB ───────────────────────────────────────────────── */}
          {activeTab === "listings" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Top Performing Listings</Text>
              {TOP_LISTINGS.map((listing, i) => (
                <TouchableOpacity key={listing.id} style={s.listingCard} activeOpacity={0.88} onPress={() => router.push(`/listing/${listing.id}`)}>
                  <View style={s.listingRank}>
                    <Text style={s.listingRankTxt}>#{i+1}</Text>
                  </View>
                  <View style={[s.listingIcon, { backgroundColor: listing.iconBg }]}>
                    <Ionicons name={listing.icon} size={18} color={listing.iconColor} />
                  </View>
                  <View style={{ flex:1, gap:8 }}>
                    <Text style={s.listingTitle} numberOfLines={1}>{listing.title}</Text>
                    <View style={s.listingStats}>
                      <View style={s.listingStat}>
                        <Ionicons name="eye-outline" size={12} color="#6B7280" />
                        <Text style={s.listingStatTxt}>{listing.views}</Text>
                      </View>
                      <View style={s.listingStat}>
                        <Ionicons name="bookmark-outline" size={12} color="#6B7280" />
                        <Text style={s.listingStatTxt}>{listing.saves}</Text>
                      </View>
                      <View style={s.listingStat}>
                        <Ionicons name="bag-check-outline" size={12} color="#6B7280" />
                        <Text style={s.listingStatTxt}>{listing.orders}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems:"flex-end", gap:4 }}>
                    <Text style={s.listingRevenue}>{listing.revenue}</Text>
                    <View style={[s.listingTag, { backgroundColor: listing.iconBg }]}>
                      <Text style={[s.listingTagTxt, { color: listing.iconColor }]}>{listing.tag}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Views bar breakdown */}
              <View style={s.divider} />
              <Text style={s.sectionTitle}>Listing Views Breakdown</Text>
              {TOP_LISTINGS.map((l, i) => {
                const maxViews = TOP_LISTINGS[0].views;
                return (
                  <View key={l.id} style={s.funnelRow}>
                    <Text style={[s.funnelLabel, { width:140 }]} numberOfLines={1}>{l.title}</Text>
                    <View style={[s.funnelBarTrack, { flex:1 }]}>
                      <AnimBar pct={Math.round(l.views/maxViews*100)} color={BAR_COLORS[i]} delay={i*80} />
                    </View>
                    <Text style={s.funnelPct}>{l.views}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── AUDIENCE TAB ───────────────────────────────────────────────── */}
          {activeTab === "audience" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Buyers by Department</Text>
              {BUYER_LOCATIONS.map((loc, i) => (
                <View key={loc.dept} style={s.audienceRow}>
                  <View style={[s.deptBadge, { backgroundColor: BAR_COLORS[i] + "20" }]}>
                    <Text style={[s.deptBadgeTxt, { color: BAR_COLORS[i] }]}>{loc.dept}</Text>
                  </View>
                  <View style={{ flex:1, gap:4 }}>
                    <Text style={s.deptLabel}>{loc.label}</Text>
                    <View style={s.funnelBarTrack}>
                      <AnimBar pct={loc.pct} color={BAR_COLORS[i]} delay={i*80} />
                    </View>
                  </View>
                  <Text style={s.funnelPct}>{loc.pct}%</Text>
                </View>
              ))}

              <View style={s.divider} />

              {/* Engagement cards */}
              <Text style={s.sectionTitle}>Engagement Insights</Text>
              <View style={s.insightGrid}>
                {[
                  { label:"Avg. response time", value:"12 min",  icon:"time-outline",          color:"#1E3A8A", bg:"#EFF6FF" },
                  { label:"Repeat buyers",       value:"24%",     icon:"people-outline",        color:"#15803D", bg:"#F0FDF4" },
                  { label:"Avg. order value",    value:"₦2,224",  icon:"cash-outline",          color:"#EA580C", bg:"#FFF7ED" },
                  { label:"Save-to-buy rate",    value:"36%",     icon:"bookmark-outline",      color:"#4C1D95", bg:"#EDE9FE" },
                ].map(ins => (
                  <View key={ins.label} style={s.insightCard}>
                    <View style={[s.insightIcon, { backgroundColor: ins.bg }]}>
                      <Ionicons name={ins.icon} size={18} color={ins.color} />
                    </View>
                    <Text style={s.insightValue}>{ins.value}</Text>
                    <Text style={s.insightLabel}>{ins.label}</Text>
                  </View>
                ))}
              </View>

              {/* Pro upsell */}
              <View style={s.proCard}>
                <Ionicons name="diamond-outline" size={20} color="#7C3AED" />
                <View style={{ flex:1 }}>
                  <Text style={s.proCardTitle}>Unlock Full Analytics</Text>
                  <Text style={s.proCardSub}>Elite tier gives you full dashboard, market insights and buyer trends.</Text>
                </View>
                <TouchableOpacity style={s.proCardBtn} onPress={() => router.push("/pro-seller")}>
                  <Text style={s.proCardBtnTxt}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:14, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },

  periodRow: { flexDirection:"row", gap:8, paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  periodBtn: { flex:1, paddingVertical:7, borderRadius:20, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center" },
  periodBtnActive: { backgroundColor:"#fff" },
  periodTxt: { fontSize:12, fontWeight:"600", color:"rgba(255,255,255,0.7)" },
  periodTxtActive: { color:"#1E3A8A", fontWeight:"800" },

  statsGrid: { flexDirection:"row", flexWrap:"wrap", padding:12, gap:10 },
  statCard: { width:(W-44)/2, backgroundColor:"#fff", borderRadius:18, padding:14, gap:4, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  statIcon: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center", marginBottom:4 },
  statValue: { fontSize:22, fontWeight:"900", color:"#111827" },
  statLabel: { fontSize:11, color:"#6B7280", fontWeight:"600" },
  statChange: { flexDirection:"row", alignItems:"center", gap:3, marginTop:2 },
  statChangeTxt: { fontSize:10, color:"#15803D", fontWeight:"700" },

  tabRow: { flexDirection:"row", marginHorizontal:16, marginBottom:4, backgroundColor:"#fff", borderRadius:14, padding:3, borderWidth:1, borderColor:"#F3F4F6" },
  tab: { flex:1, paddingVertical:8, alignItems:"center", borderRadius:11 },
  tabActive: { backgroundColor:"#1E3A8A" },
  tabTxt: { fontSize:13, fontWeight:"600", color:"#6B7280" },
  tabTxtActive: { color:"#fff", fontWeight:"800" },

  section: { paddingHorizontal:16, paddingTop:16, gap:14 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:"#111827" },

  // Bar chart
  chartWrap: { flexDirection:"row", alignItems:"flex-end", gap:8, height:120 },
  barCol: { flex:1, alignItems:"center", gap:4 },
  barRevTxt: { fontSize:8, color:"#9CA3AF", fontWeight:"600" },
  barTrack: { flex:1, width:"100%", backgroundColor:"#F3F4F6", borderRadius:6, overflow:"hidden", justifyContent:"flex-end" },
  barFill: { width:"100%", borderRadius:6 },
  barDayTxt: { fontSize:10, color:"#6B7280", fontWeight:"600" },

  divider: { height:1, backgroundColor:"#F3F4F6", marginVertical:4 },

  // Funnel
  funnelWrap: { gap:12 },
  funnelRow: { flexDirection:"row", alignItems:"center", gap:10 },
  funnelLeft: { width:110 },
  funnelLabel: { fontSize:11, color:"#6B7280", fontWeight:"600" },
  funnelValue: { fontSize:14, fontWeight:"800", color:"#111827" },
  funnelBarTrack: { flex:1, height:8, backgroundColor:"#F3F4F6", borderRadius:4, overflow:"hidden" },
  funnelPct: { width:36, fontSize:11, color:"#6B7280", fontWeight:"700", textAlign:"right" },

  // Listings
  listingCard: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  listingRank: { width:22, alignItems:"center" },
  listingRankTxt: { fontSize:12, fontWeight:"900", color:"#9CA3AF" },
  listingIcon: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  listingTitle: { fontSize:13, fontWeight:"700", color:"#111827" },
  listingStats: { flexDirection:"row", gap:12 },
  listingStat: { flexDirection:"row", alignItems:"center", gap:3 },
  listingStatTxt: { fontSize:11, color:"#6B7280" },
  listingRevenue: { fontSize:13, fontWeight:"900", color:"#1E3A8A" },
  listingTag: { paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  listingTagTxt: { fontSize:9, fontWeight:"700" },

  // Audience
  audienceRow: { flexDirection:"row", alignItems:"center", gap:10 },
  deptBadge: { width:44, height:28, borderRadius:8, alignItems:"center", justifyContent:"center" },
  deptBadgeTxt: { fontSize:10, fontWeight:"800" },
  deptLabel: { fontSize:12, color:"#374151", fontWeight:"600" },

  insightGrid: { flexDirection:"row", flexWrap:"wrap", gap:10 },
  insightCard: { width:(W-52)/2, backgroundColor:"#fff", borderRadius:16, padding:14, gap:6, borderWidth:1, borderColor:"#F3F4F6" },
  insightIcon: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  insightValue: { fontSize:18, fontWeight:"900", color:"#111827" },
  insightLabel: { fontSize:11, color:"#6B7280", lineHeight:15 },

  proCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#F5F3FF", borderRadius:18, padding:16, borderWidth:1, borderColor:"#DDD6FE" },
  proCardTitle: { fontSize:14, fontWeight:"800", color:"#4C1D95" },
  proCardSub: { fontSize:11, color:"#7C3AED", lineHeight:16, marginTop:2 },
  proCardBtn: { paddingHorizontal:14, paddingVertical:8, borderRadius:12, backgroundColor:"#7C3AED" },
  proCardBtnTxt: { fontSize:12, fontWeight:"800", color:"#fff" },
});
