// app/pro-seller.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ─── TIER DATA ────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "basic",
    label: "Basic",
    price: "₦2,000",
    sub: "/month",
    accent: "#0369A1",
    accentLight: "#F0F9FF",
    accentBorder: "#BAE6FD",
    badge: null,
    tagline: "Start selling today",
    perks: [
      { icon:"eye-outline",             text:"Standard marketplace visibility" },
      { icon:"analytics-outline",       text:"Limited seller analytics"        },
      { icon:"star-outline",            text:"Customer reviews & ratings"      },
      { icon:"pricetag-outline",        text:"Pin listings for ₦500 / 24hrs"   },
      { icon:"shield-checkmark-outline",text:"Admin approval required"         },
    ],
  },
  {
    id: "pro",
    label: "Pro",
    price: "₦3,000",
    sub: "/month",
    accent: "#1E3A8A",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
    badge: "POPULAR",
    tagline: "Grow your business",
    perks: [
      { icon:"trending-up-outline",     text:"Higher feed visibility"          },
      { icon:"analytics-outline",       text:"Expanded seller analytics"       },
      { icon:"ribbon-outline",          text:"Pro seller badge"                },
      { icon:"star-outline",            text:"Customer reviews & ratings"      },
      { icon:"pricetag-outline",        text:"Pin listings for ₦500 / 24hrs"   },
      { icon:"shield-checkmark-outline",text:"Admin approval required"         },
    ],
  },
  {
    id: "elite",
    label: "Elite",
    price: "₦6,000",
    sub: "/month",
    accent: "#7C3AED",
    accentLight: "#F5F3FF",
    accentBorder: "#DDD6FE",
    badge: "BEST",
    tagline: "Dominate the market",
    perks: [
      { icon:"rocket-outline",          text:"Highest feed visibility boost"   },
      { icon:"analytics-outline",       text:"Full analytics & market insights"},
      { icon:"diamond-outline",         text:"Premium seller badge"            },
      { icon:"star-outline",            text:"Customer reviews & ratings"      },
      { icon:"pricetag-outline",        text:"Pin listings for ₦500 / 24hrs"   },
      { icon:"shield-checkmark-outline",text:"Admin approval required"         },
    ],
  },
];

// Full comparison table
const COMPARE_ROWS = [
  { label:"Feed visibility",   basic:"Standard",  pro:"Higher",    elite:"Highest"         },
  { label:"Analytics",         basic:"Limited",   pro:"Expanded",  elite:"Full + insights" },
  { label:"Seller badge",      basic:"Standard",  pro:"Pro badge", elite:"Premium badge"   },
  { label:"Listing pinning",   basic:"₦500/24hr", pro:"₦500/24hr", elite:"₦500/24hr"       },
  { label:"Subscription",      basic:"30 days",   pro:"30 days",   elite:"30 days"         },
  { label:"Admin approval",    basic:"Required",  pro:"Required",  elite:"Required"        },
];

export default function ProSeller() {
  const [selected, setSelected] = useState("pro");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:460, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:460, useNativeDriver:true }),
    ]).start();
  }, []);

  const tier = TIERS.find(t => t.id === selected);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Seller Plans</Text>
        <View style={{ width:24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.badgeRow}>
              <Ionicons name="storefront" size={15} color="#FCD34D" />
              <Text style={s.badgeLabel}>NEXWAD SELLER PRO</Text>
              <Ionicons name="storefront" size={15} color="#FCD34D" />
            </View>
            <Text style={s.heroTitle}>Sell more.{"\n"}Earn more.</Text>
            <Text style={s.heroSub}>Everything you need to run a thriving campus business on AFIT.</Text>
          </View>

          {/* Tier selector cards */}
          <View style={s.tierRow}>
            {TIERS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.tierCard,
                  { borderColor: selected===t.id ? t.accent : "#E5E7EB",
                    backgroundColor: selected===t.id ? t.accentLight : "#F9FAFB" }
                ]}
                onPress={() => setSelected(t.id)}
                activeOpacity={0.85}
              >
                {t.badge && (
                  <View style={[s.tierBadge, { backgroundColor: t.accent }]}>
                    <Text style={s.tierBadgeTxt}>{t.badge}</Text>
                  </View>
                )}
                <Text style={[s.tierLabel, { color: selected===t.id ? t.accent : "#9CA3AF" }]}>{t.label}</Text>
                <Text style={[s.tierPrice, { color: selected===t.id ? t.accent : "#374151" }]}>{t.price}</Text>
                <Text style={[s.tierSub, { color: selected===t.id ? t.accent+"99" : "#9CA3AF" }]}>{t.sub}</Text>
                {selected===t.id && (
                  <View style={[s.tierCheck, { backgroundColor: t.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected tier detail card */}
          <View style={[s.detailCard, { borderColor: tier.accentBorder, backgroundColor: tier.accentLight }]}>
            {/* Top row */}
            <View style={s.detailTop}>
              <View style={[s.detailIconWrap, { backgroundColor: tier.accent }]}>
                <Ionicons
                  name={selected==="elite"?"diamond-outline":selected==="pro"?"ribbon-outline":"storefront-outline"}
                  size={22} color="#fff"
                />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[s.detailTierName, { color: tier.accent }]}>{tier.label} Seller</Text>
                <Text style={s.detailTagline}>{tier.tagline}</Text>
              </View>
              <View style={s.detailPriceCol}>
                <Text style={[s.detailPrice, { color: tier.accent }]}>{tier.price}</Text>
                <Text style={s.detailPriceSub}>{tier.sub}</Text>
              </View>
            </View>

            <View style={[s.detailDivider, { backgroundColor: tier.accent + "22" }]} />

            {/* Perks list */}
            {tier.perks.map((perk, i) => (
              <View key={i} style={s.perkRow}>
                <View style={[s.perkIconWrap, { backgroundColor: tier.accent + "18" }]}>
                  <Ionicons name={perk.icon} size={14} color={tier.accent} />
                </View>
                <Text style={s.perkText}>{perk.text}</Text>
              </View>
            ))}

            {/* Admin approval note */}
            <View style={[s.approvalNote, { backgroundColor: tier.accent + "12", borderColor: tier.accent + "30" }]}>
              <Ionicons name="information-circle-outline" size={15} color={tier.accent} />
              <Text style={[s.approvalTxt, { color: tier.accent }]}>
                Seller accounts require admin approval before going live. You'll be notified within 24 hours.
              </Text>
            </View>
          </View>

          {/* Compare all plans toggle */}
          <TouchableOpacity style={s.compareToggle} onPress={() => setShowCompare(v => !v)} activeOpacity={0.8}>
            <Text style={s.compareToggleTxt}>Compare all plans</Text>
            <Ionicons name={showCompare?"chevron-up":"chevron-down"} size={16} color="#1E3A8A" />
          </TouchableOpacity>

          {showCompare && (
            <View style={s.compareWrap}>
              {/* Header */}
              <View style={s.compareHeader}>
                <Text style={s.compareCol0}>Feature</Text>
                <Text style={[s.compareCol, { color:"#0369A1" }]}>Basic</Text>
                <Text style={[s.compareCol, { color:"#1E3A8A" }]}>Pro</Text>
                <Text style={[s.compareCol, { color:"#7C3AED" }]}>Elite</Text>
              </View>
              {COMPARE_ROWS.map((row, i) => (
                <View key={row.label} style={[s.compareRow, i%2===0 && { backgroundColor:"#F9FAFB" }]}>
                  <Text style={s.compareRowLabel}>{row.label}</Text>
                  <Text style={[s.compareRowVal, { color:"#0369A1" }]}>{row.basic}</Text>
                  <Text style={[s.compareRowVal, { color:"#1E3A8A" }]}>{row.pro}</Text>
                  <Text style={[s.compareRowVal, { color:"#7C3AED" }]}>{row.elite}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Guarantee */}
          <View style={s.guarantee}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#15803D" />
            <Text style={s.guaranteeTxt}>Cancel anytime. No hidden fees. AFIT student-priced.</Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: tier.accent, shadowColor: tier.accent }]}
          onPress={() => router.push({ pathname: "/seller-checkout", params: { tier: selected } })}
        >
          <Ionicons name="sparkles" size={16} color="#FCD34D" />
          <Text style={s.ctaTxt}>Start {tier.label} — {tier.price}{tier.sub}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop:10, alignItems:"center" }}>
          <Text style={s.skipTxt}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },

  hero: { backgroundColor:"#1E3A8A", alignItems:"center", paddingHorizontal:28, paddingBottom:32, paddingTop:4 },
  badgeRow: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.1)", paddingHorizontal:14, paddingVertical:6, borderRadius:20, marginBottom:14 },
  badgeLabel: { fontSize:10, fontWeight:"900", color:"#FCD34D", letterSpacing:1.5 },
  heroTitle: { fontSize:30, fontWeight:"900", color:"#fff", textAlign:"center", letterSpacing:-0.5, lineHeight:36, marginBottom:8 },
  heroSub: { fontSize:14, color:"#93C5FD", textAlign:"center", lineHeight:21 },

  // Tier selector
  tierRow: { flexDirection:"row", gap:8, paddingHorizontal:16, paddingVertical:18 },
  tierCard: { flex:1, borderRadius:18, borderWidth:1.5, padding:11, alignItems:"center", position:"relative", overflow:"hidden" },
  tierBadge: { position:"absolute", top:0, right:0, paddingHorizontal:6, paddingVertical:2, borderBottomLeftRadius:9 },
  tierBadgeTxt: { fontSize:7, fontWeight:"900", color:"#fff", letterSpacing:0.3 },
  tierLabel: { fontSize:10, fontWeight:"700", textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 },
  tierPrice: { fontSize:15, fontWeight:"900", letterSpacing:-0.3 },
  tierSub: { fontSize:9, marginTop:1 },
  tierCheck: { position:"absolute", top:7, left:7, width:16, height:16, borderRadius:8, alignItems:"center", justifyContent:"center" },

  // Detail card
  detailCard: { marginHorizontal:16, borderRadius:22, borderWidth:1.5, padding:18, marginBottom:16 },
  detailTop: { flexDirection:"row", alignItems:"center", gap:12, marginBottom:14 },
  detailIconWrap: { width:46, height:46, borderRadius:23, alignItems:"center", justifyContent:"center" },
  detailTierName: { fontSize:17, fontWeight:"900", letterSpacing:-0.3 },
  detailTagline: { fontSize:12, color:"#6B7280", marginTop:2 },
  detailPriceCol: { alignItems:"flex-end" },
  detailPrice: { fontSize:20, fontWeight:"900", letterSpacing:-0.5 },
  detailPriceSub: { fontSize:11, color:"#9CA3AF" },
  detailDivider: { height:1, marginBottom:14 },
  perkRow: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 },
  perkIconWrap: { width:30, height:30, borderRadius:15, alignItems:"center", justifyContent:"center" },
  perkText: { fontSize:13, color:"#374151", fontWeight:"500", flex:1 },
  approvalNote: { flexDirection:"row", gap:9, borderRadius:14, padding:12, borderWidth:1, marginTop:6 },
  approvalTxt: { flex:1, fontSize:11, lineHeight:17 },

  // Compare toggle
  compareToggle: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, paddingVertical:12, marginHorizontal:16 },
  compareToggleTxt: { fontSize:13, fontWeight:"700", color:"#1E3A8A" },

  // Compare table
  compareWrap: { marginHorizontal:16, borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", marginBottom:4 },
  compareHeader: { flexDirection:"row", alignItems:"center", paddingHorizontal:12, paddingVertical:11, backgroundColor:"#F9FAFB", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  compareCol0: { flex:1.4, fontSize:10, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase" },
  compareCol: { flex:1, fontSize:10, fontWeight:"800", textAlign:"center" },
  compareRow: { flexDirection:"row", alignItems:"center", paddingHorizontal:12, paddingVertical:10 },
  compareRowLabel: { flex:1.4, fontSize:11, color:"#374151", fontWeight:"500" },
  compareRowVal: { flex:1, fontSize:10, fontWeight:"700", textAlign:"center" },

  guarantee: { flexDirection:"row", alignItems:"center", gap:10, margin:16, backgroundColor:"#F0FDF4", borderRadius:14, padding:13, borderWidth:1, borderColor:"#BBF7D0" },
  guaranteeTxt: { flex:1, fontSize:12, color:"#15803D", lineHeight:18 },

  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  skipTxt: { fontSize:13, color:"#9CA3AF" },
});
