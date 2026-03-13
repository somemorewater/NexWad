// app/pro-buyer.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BUYER_FEATURES = [
  { icon:"bag-outline",              label:"Browse & buy listings",             free:true,  premium:true  },
  { icon:"chatbubble-outline",       label:"Message sellers",                   free:true,  premium:true  },
  { icon:"star-outline",             label:"Rate & review sellers",             free:true,  premium:true  },
  { icon:"heart-outline",            label:"Wishlist / save items",             free:true,  premium:true  },
  { icon:"search-outline",           label:"Post in Lost & Found",              free:true,  premium:true  },
  { icon:"thumbs-up-outline",        label:"Like, comment & follow",            free:true,  premium:true  },
  { icon:"ban-outline",              label:"Ad-free experience",                free:false, premium:true  },
  { icon:"ribbon-outline",           label:"Premium Buyer badge",               free:false, premium:true  },
  { icon:"megaphone-outline",        label:"Highlighted new posts",             free:false, premium:true  },
  { icon:"flash-outline",            label:"Early access to selected listings", free:false, premium:true  },
  { icon:"pricetag-outline",         label:"Exclusive buyer deals",             free:false, premium:true  },
  { icon:"create-outline",           label:"Edit posts and comments",           free:false, premium:true  },
  { icon:"analytics-outline",        label:"Buyer analytics dashboard",         free:false, premium:true  },
  { icon:"headset-outline",          label:"Priority customer support",         free:false, premium:true  },
];

export default function ProBuyer() {
  const [selected, setSelected] = useState("premium");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:460, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:460, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#F97316" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buyer Plans</Text>
        <View style={{ width:24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.badgeRow}>
              <Ionicons name="bag-handle" size={16} color="#FCD34D" />
              <Text style={s.badgeLabel}>NEXWAD BUYER PRO</Text>
              <Ionicons name="bag-handle" size={16} color="#FCD34D" />
            </View>
            <Text style={s.heroTitle}>Shop smarter.{"\n"}Get more.</Text>
            <Text style={s.heroSub}>Unlock premium buyer perks across the entire AFIT marketplace.</Text>
          </View>

          {/* Plan cards */}
          <View style={s.planRow}>
            {/* Free */}
            <TouchableOpacity
              style={[s.planCard, selected==="free" && s.planCardOn, selected==="free" && { borderColor:"#9CA3AF" }]}
              onPress={() => setSelected("free")}
              activeOpacity={0.85}
            >
              <Text style={s.planName}>Regular</Text>
              <Text style={[s.planPrice, { color:"#374151" }]}>₦0</Text>
              <Text style={s.planSub}>forever free</Text>
              {selected==="free" && <View style={[s.planCheck, { backgroundColor:"#9CA3AF" }]}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
            </TouchableOpacity>

            {/* Premium */}
            <TouchableOpacity
              style={[s.planCard, selected==="premium" && s.planCardOn, { borderColor: selected==="premium"?"#F97316":"#E5E7EB", backgroundColor: selected==="premium"?"#FFF7ED":"#F9FAFB" }]}
              onPress={() => setSelected("premium")}
              activeOpacity={0.85}
            >
              <View style={s.hotBadge}><Text style={s.hotBadgeTxt}>POPULAR</Text></View>
              <Text style={[s.planName, selected==="premium" && { color:"#F97316" }]}>Premium</Text>
              <Text style={[s.planPrice, { color:"#F97316" }]}>₦800</Text>
              <Text style={[s.planSub, selected==="premium" && { color:"#FB923C" }]}>/month</Text>
              {selected==="premium" && <View style={[s.planCheck, { backgroundColor:"#F97316" }]}><Ionicons name="checkmark" size={11} color="#fff" /></View>}
            </TouchableOpacity>
          </View>

          {/* Feature table */}
          <View style={s.tableWrap}>
            <View style={s.tableHeader}>
              <Text style={s.tableHeaderMain}>Features</Text>
              <Text style={s.tableHeaderFree}>Regular</Text>
              <Text style={[s.tableHeaderPro, { color:"#F97316" }]}>Premium</Text>
            </View>
            {BUYER_FEATURES.map((feat, i) => (
              <View key={feat.label} style={[s.featRow, i%2===0 && { backgroundColor:"#F9FAFB" }]}>
                <View style={s.featLeft}>
                  <Ionicons name={feat.icon} size={14} color="#6B7280" />
                  <Text style={s.featLabel}>{feat.label}</Text>
                </View>
                <View style={s.featCell}>
                  <Ionicons name={feat.free?"checkmark-circle":"close-circle"} size={18} color={feat.free?"#22C55E":"#E5E7EB"} />
                </View>
                <View style={s.featCell}>
                  <Ionicons name={feat.premium?"checkmark-circle":"close-circle"} size={18} color={feat.premium?"#F97316":"#E5E7EB"} />
                </View>
              </View>
            ))}
          </View>

          {/* Guarantee */}
          <View style={s.guarantee}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#15803D" />
            <Text style={s.guaranteeTxt}>Cancel anytime. No hidden fees. AFIT student-priced.</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        {selected === "premium" ? (
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push("/checkout")}>
            <Ionicons name="sparkles" size={16} color="#FCD34D" />
            <Text style={s.ctaTxt}>Get Premium Buyer — ₦800/month</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor:"#374151" }]} onPress={() => router.back()}>
            <Text style={s.ctaTxt}>Continue as Regular Buyer</Text>
          </TouchableOpacity>
        )}
        {selected === "premium" && (
          <TouchableOpacity style={s.analyticsLink} onPress={() => router.push("/buyer-analytics")}>
            <Ionicons name="analytics-outline" size={14} color="#F97316" />
            <Text style={s.analyticsLinkTxt}>View my spending dashboard</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop:10, alignItems:"center" }}>
          <Text style={s.skipTxt}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#F97316" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  hero: { backgroundColor:"#F97316", alignItems:"center", paddingHorizontal:28, paddingBottom:32, paddingTop:4 },
  badgeRow: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.15)", paddingHorizontal:14, paddingVertical:6, borderRadius:20, marginBottom:14 },
  badgeLabel: { fontSize:10, fontWeight:"900", color:"#FCD34D", letterSpacing:1.5 },
  heroTitle: { fontSize:30, fontWeight:"900", color:"#fff", textAlign:"center", letterSpacing:-0.5, lineHeight:36, marginBottom:8 },
  heroSub: { fontSize:14, color:"#FFEDD5", textAlign:"center", lineHeight:21 },

  planRow: { flexDirection:"row", gap:12, paddingHorizontal:16, paddingVertical:20 },
  planCard: { flex:1, borderRadius:20, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", padding:14, alignItems:"center", position:"relative", overflow:"hidden" },
  planCardOn: { },
  hotBadge: { position:"absolute", top:0, right:0, backgroundColor:"#F97316", paddingHorizontal:7, paddingVertical:3, borderBottomLeftRadius:10 },
  hotBadgeTxt: { fontSize:7, fontWeight:"900", color:"#fff", letterSpacing:0.5 },
  planName: { fontSize:12, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 },
  planPrice: { fontSize:22, fontWeight:"900", letterSpacing:-0.5 },
  planSub: { fontSize:10, color:"#9CA3AF", marginTop:1 },
  planCheck: { position:"absolute", top:8, left:8, width:18, height:18, borderRadius:9, alignItems:"center", justifyContent:"center" },

  tableWrap: { marginHorizontal:16, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6" },
  tableHeader: { flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingVertical:11, backgroundColor:"#F9FAFB", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  tableHeaderMain: { flex:1, fontSize:11, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 },
  tableHeaderFree: { width:50, textAlign:"center", fontSize:11, fontWeight:"700", color:"#9CA3AF" },
  tableHeaderPro: { width:50, textAlign:"center", fontSize:11, fontWeight:"800" },
  featRow: { flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingVertical:11 },
  featLeft: { flex:1, flexDirection:"row", alignItems:"center", gap:9 },
  featLabel: { fontSize:12, color:"#374151", fontWeight:"500", flexShrink:1 },
  featCell: { width:50, alignItems:"center" },

  guarantee: { flexDirection:"row", alignItems:"center", gap:10, margin:16, backgroundColor:"#F0FDF4", borderRadius:14, padding:13, borderWidth:1, borderColor:"#BBF7D0" },
  guaranteeTxt: { flex:1, fontSize:12, color:"#15803D", lineHeight:18 },

  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#F97316", shadowColor:"#F97316", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  skipTxt: { fontSize:13, color:"#9CA3AF" },
  analyticsLink: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, marginTop:10 },
  analyticsLinkTxt: { fontSize:13, color:"#F97316", fontWeight:"700" },
});
