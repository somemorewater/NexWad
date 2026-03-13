// app/become-seller.jsx
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Animated, ScrollView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STEPS = [
  { num:"01", title:"Complete your profile",    body:"Add your name, dept, and a profile photo so buyers trust you.",             icon:"person-circle-outline",   bg:"#DBEAFE", color:"#1E3A8A" },
  { num:"02", title:"Get verified",             body:"We verify your AFIT student status to keep the marketplace safe.",         icon:"shield-checkmark-outline", bg:"#F0FDF4", color:"#15803D" },
  { num:"03", title:"Post your first listing",  body:"Upload photos, set a fair price and publish in under 2 minutes.",          icon:"cloud-upload-outline",     bg:"#EDE9FE", color:"#4C1D95" },
  { num:"04", title:"Get paid",                 body:"Receive payment on delivery or via bank transfer. Simple & safe.",         icon:"wallet-outline",           bg:"#FEF9C3", color:"#854D0E" },
];

const PERKS = [
  { icon:"storefront-outline",    label:"Your own seller storefront"            },
  { icon:"analytics-outline",     label:"Sales analytics & insights"            },
  { icon:"star-outline",          label:"Verified seller badge"                 },
  { icon:"megaphone-outline",     label:"Promote listings to more buyers"       },
  { icon:"bicycle-outline",       label:"Campus delivery integration"           },
  { icon:"chatbubble-outline",    label:"Built-in buyer messaging"              },
];

export default function BecomeSeller() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue:1, duration:500, useNativeDriver:true}),
      Animated.timing(slideAnim, {toValue:0, duration:500, useNativeDriver:true}),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Become a Seller</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:100}}>
        <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}]}}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="storefront" size={46} color="#1E3A8A" />
            </View>
            <Text style={s.heroTitle}>Start selling on{"\n"}your campus.</Text>
            <Text style={s.heroSub}>Join 200+ AFIT students already making money on Nexwad.</Text>
            <View style={s.statsRow}>
              {[["200+","Active sellers"],["₦2.4M","Sold this month"],["4.8★","Avg rating"]].map(([num, lbl]) => (
                <View key={lbl} style={s.statItem}>
                  <Text style={s.statNum}>{num}</Text>
                  <Text style={s.statLbl}>{lbl}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* How it works */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>How it works</Text>
            {STEPS.map((step, i) => (
              <View key={step.num} style={s.stepRow}>
                <View style={[s.stepIcon, {backgroundColor:step.bg}]}>
                  <Ionicons name={step.icon} size={22} color={step.color} />
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:"row", alignItems:"center", gap:8}}>
                    <Text style={s.stepNum}>{step.num}</Text>
                    <Text style={s.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={s.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Perks */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>What you get</Text>
            <View style={s.perksGrid}>
              {PERKS.map(p => (
                <View key={p.label} style={s.perkItem}>
                  <Ionicons name={p.icon} size={20} color="#1E3A8A" />
                  <Text style={s.perkLabel}>{p.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Testimonial */}
          <View style={s.testimonial}>
            <View style={s.quoteIcon}><Text style={s.quoteGlyph}>"</Text></View>
            <Text style={s.quoteBody}>I made ₦45,000 in my first month selling textbooks and tutoring sessions. Nexwad made it so easy!</Text>
            <View style={s.quoteFooter}>
              <View style={s.quoteAvatar}><Text style={{fontSize:12, fontWeight:"800", color:"#9D174D"}}>FY</Text></View>
              <Text style={s.quoteAuthor}>Fatima Y. · MEC 200L · Top Seller</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      <View style={s.cta}>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push("/pro-seller")}>
          <Ionicons name="storefront-outline" size={17} color="#fff" />
          <Text style={s.ctaBtnTxt}>Start Selling Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  hero: { alignItems:"center", padding:28, paddingTop:32, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  heroIconWrap: { width:80, height:80, borderRadius:40, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", marginBottom:16 },
  heroTitle: { fontSize:28, fontWeight:"900", color:"#111827", textAlign:"center", letterSpacing:-0.5, lineHeight:34, marginBottom:10 },
  heroSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:21, marginBottom:20 },
  statsRow: { flexDirection:"row", gap:0, backgroundColor:"#F9FAFB", borderRadius:16, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6" },
  statItem: { flex:1, alignItems:"center", paddingVertical:12 },
  statNum: { fontSize:16, fontWeight:"900", color:"#1E3A8A" },
  statLbl: { fontSize:10, color:"#9CA3AF", marginTop:1 },
  section: { padding:20 },
  sectionTitle: { fontSize:17, fontWeight:"800", color:"#111827", marginBottom:16 },
  stepRow: { flexDirection:"row", gap:14, marginBottom:20, alignItems:"flex-start" },
  stepIcon: { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center" },
  stepNum: { fontSize:10, fontWeight:"900", color:"#D1D5DB" },
  stepTitle: { fontSize:14, fontWeight:"700", color:"#111827" },
  stepBody: { fontSize:13, color:"#6B7280", lineHeight:19, marginTop:3 },
  perksGrid: { flexDirection:"row", flexWrap:"wrap", gap:10 },
  perkItem: { flexDirection:"row", alignItems:"center", gap:8, width:"46%", backgroundColor:"#F9FAFB", borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:"#F3F4F6" },
  perkLabel: { fontSize:12, fontWeight:"600", color:"#374151", flex:1 },
  testimonial: { marginHorizontal:20, marginBottom:8, backgroundColor:"#EFF6FF", borderRadius:20, padding:18, borderWidth:1, borderColor:"#BFDBFE" },
  quoteIcon: { marginBottom:8 },
  quoteGlyph: { fontSize:36, color:"#BFDBFE", fontWeight:"900", lineHeight:36 },
  quoteBody: { fontSize:14, color:"#374151", lineHeight:22, fontStyle:"italic", marginBottom:14 },
  quoteFooter: { flexDirection:"row", alignItems:"center", gap:10 },
  quoteAvatar: { width:32, height:32, borderRadius:16, backgroundColor:"#FCE7F3", alignItems:"center", justifyContent:"center" },
  quoteAuthor: { fontSize:12, color:"#6B7280", fontWeight:"500" },
  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
});
