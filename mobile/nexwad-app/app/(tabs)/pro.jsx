// app/pro.jsx  — track selector: Buyer vs Seller
import React, { useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TRACKS = [
  {
    id: "buyer",
    route: "/pro-buyer",
    iconFill: "bag-handle",
    label: "I'm a Buyer",
    sub: "Get premium perks as a shopper",
    accent: "#F97316",
    accentLight: "#FFF7ED",
    accentBorder: "#FED7AA",
    pills: ["Priority support", "Exclusive deals", "Premium badge"],
    topPrice: "₦800/mo",
  },
  {
    id: "seller",
    route: "/pro-seller",
    iconFill: "storefront",
    label: "I'm a Seller",
    sub: "Grow your campus business",
    accent: "#1E3A8A",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
    pills: ["More listings", "Analytics", "Seller badge"],
    topPrice: "From ₦2,000/mo",
  },
];

export default function ProLanding() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
        Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
      ]),
      Animated.stagger(120, [
        Animated.spring(card1Anim, { toValue:1, useNativeDriver:true, damping:18, stiffness:180 }),
        Animated.spring(card2Anim, { toValue:1, useNativeDriver:true, damping:18, stiffness:180 }),
      ]),
    ]).start();
  }, []);

  const cardAnims = [card1Anim, card2Anim];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nexwad Pro</Text>
        <View style={{ width:24 }} />
      </View>

      {/* Hero */}
      <Animated.View style={[s.hero, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <View style={s.sparkleRow}>
          <Ionicons name="sparkles" size={16} color="#FCD34D" />
          <Text style={s.sparkleLabel}>UPGRADE YOUR EXPERIENCE</Text>
          <Ionicons name="sparkles" size={16} color="#FCD34D" />
        </View>
        <Text style={s.heroTitle}>Which best{"\n"}describes you?</Text>
        <Text style={s.heroSub}>Choose your track to see plans built for you.</Text>
      </Animated.View>

      {/* Track cards */}
      <View style={s.cards}>
        {TRACKS.map((track, i) => (
          <Animated.View key={track.id} style={{
            opacity: cardAnims[i],
            transform: [{ scale: cardAnims[i].interpolate({ inputRange:[0,1], outputRange:[0.88,1] }) }],
          }}>
            <TouchableOpacity
              style={[s.card, { borderColor:track.accentBorder, backgroundColor:track.accentLight }]}
              activeOpacity={0.88}
              onPress={() => router.push(track.route)}
            >
              <View style={[s.iconWrap, { backgroundColor:track.accent }]}>
                <Ionicons name={track.iconFill} size={28} color="#fff" />
              </View>
              <View style={s.cardBody}>
                <Text style={[s.cardLabel, { color:track.accent }]}>{track.label}</Text>
                <Text style={s.cardSub}>{track.sub}</Text>
                <View style={s.pillRow}>
                  {track.pills.map(p => (
                    <View key={p} style={[s.pill, { backgroundColor:track.accent+"18", borderColor:track.accent+"40" }]}>
                      <Text style={[s.pillTxt, { color:track.accent }]}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.topPrice, { color:track.accent }]}>{track.topPrice}</Text>
                <View style={[s.arrowWrap, { backgroundColor:track.accent }]}>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[s.footerNote, { opacity:fadeAnim }]}>
        <Ionicons name="shield-checkmark-outline" size={15} color="#15803D" />
        <Text style={s.footerNoteTxt}>Cancel anytime · No hidden fees · AFIT student-priced</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  hero: { backgroundColor:"#1E3A8A", alignItems:"center", paddingHorizontal:28, paddingBottom:32, paddingTop:4 },
  sparkleRow: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.1)", paddingHorizontal:14, paddingVertical:6, borderRadius:20, marginBottom:14 },
  sparkleLabel: { fontSize:10, fontWeight:"900", color:"#FCD34D", letterSpacing:1.5 },
  heroTitle: { fontSize:30, fontWeight:"900", color:"#fff", textAlign:"center", letterSpacing:-0.5, lineHeight:36, marginBottom:8 },
  heroSub: { fontSize:14, color:"#93C5FD", textAlign:"center" },
  cards: { flex:1, justifyContent:"center", paddingHorizontal:16, gap:16, paddingTop:24 },
  card: { borderRadius:24, borderWidth:1.5, padding:18, flexDirection:"row", alignItems:"center", gap:14, shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.07, shadowRadius:12, elevation:4 },
  iconWrap: { width:56, height:56, borderRadius:28, alignItems:"center", justifyContent:"center", flexShrink:0 },
  cardBody: { flex:1, gap:4 },
  cardLabel: { fontSize:17, fontWeight:"900", letterSpacing:-0.3 },
  cardSub: { fontSize:12, color:"#6B7280", marginBottom:6 },
  pillRow: { flexDirection:"row", flexWrap:"wrap", gap:6 },
  pill: { paddingHorizontal:8, paddingVertical:3, borderRadius:10, borderWidth:1 },
  pillTxt: { fontSize:10, fontWeight:"700" },
  cardRight: { alignItems:"flex-end", gap:8, flexShrink:0 },
  topPrice: { fontSize:11, fontWeight:"800", textAlign:"right" },
  arrowWrap: { width:30, height:30, borderRadius:15, alignItems:"center", justifyContent:"center" },
  footerNote: { flexDirection:"row", alignItems:"center", gap:8, marginHorizontal:16, marginBottom:Platform.OS==="ios"?8:16, backgroundColor:"#F0FDF4", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BBF7D0" },
  footerNoteTxt: { flex:1, fontSize:12, color:"#15803D" },
});
