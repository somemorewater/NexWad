// app/pin-listing.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const DURATIONS = [
  { id:"24h",  label:"24 hours",  price:500,   perDay:500,  tag:null           },
  { id:"48h",  label:"48 hours",  price:900,   perDay:450,  tag:"Save ₦100"    },
  { id:"72h",  label:"72 hours",  price:1200,  perDay:400,  tag:"Save ₦300"    },
  { id:"7d",   label:"7 days",    price:2800,  perDay:400,  tag:"Best value 🔥" },
];

const PAYMENT_METHODS = [
  { id:"card",     label:"Debit Card",     sub:"GTBank •••• 4521", icon:"card-outline",           bg:"#EFF6FF", color:"#1E3A8A" },
  { id:"transfer", label:"Bank Transfer",  sub:"Access Bank",      icon:"business-outline",        bg:"#F0FDF4", color:"#15803D" },
  { id:"wallet",   label:"Opay Wallet",    sub:"₦3,200 balance",   icon:"phone-portrait-outline",  bg:"#FEF9C3", color:"#B45309" },
];

// What pinning actually does — shown as benefits
const PIN_PERKS = [
  { icon:"rocket-outline",      color:"#1E3A8A", bg:"#EFF6FF", text:"Appears at the top of relevant listings and feed" },
  { icon:"eye-outline",         color:"#15803D", bg:"#F0FDF4", text:"Pin badge visible to all buyers browsing" },
  { icon:"trending-up-outline", color:"#F97316", bg:"#FFF7ED", text:"Among pinned listings, most recent pins rank first" },
  { icon:"time-outline",        color:"#4C1D95", bg:"#EDE9FE", text:"Pin expires automatically — no manual removal needed" },
];

const DurationCard = ({ d, index, selected, onSelect }) => {
  const isSelected = selected === d.id;
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity:fa, transform:[{translateY:sa}] }}>
      <TouchableOpacity
        style={[s.durCard, isSelected && s.durCardActive]}
        onPress={() => onSelect(d.id)}
        activeOpacity={0.88}
      >
        <View style={[s.radio, isSelected && s.radioActive]}>
          {isSelected && <View style={s.radioDot} />}
        </View>
        <View style={{ flex:1 }}>
          <View style={s.durTop}>
            <Text style={[s.durLabel, isSelected && { color:"#1E3A8A" }]}>{d.label}</Text>
            {d.tag && (
              <View style={[s.durTag, isSelected && s.durTagActive]}>
                <Text style={[s.durTagTxt, isSelected && { color:"#1E3A8A" }]}>{d.tag}</Text>
              </View>
            )}
          </View>
          <Text style={s.durPer}>₦{d.perDay}/day</Text>
        </View>
        <Text style={[s.durPrice, isSelected && { color:"#1E3A8A" }]}>₦{d.price.toLocaleString()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function PinListing() {
  const params = useLocalSearchParams();
  const listingTitle = params.title || "HP 65W USB-C Charger";
  const listingId    = params.id    || "l1";

  const [selected,  setSelected]  = useState("24h");
  const [payment,   setPayment]   = useState("card");
  const [step,      setStep]      = useState("choose"); // choose | confirm | success
  const [paying,    setPaying]    = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(24)).current;
  const doneScale  = useRef(new Animated.Value(0)).current;
  const pinBounce  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const dur = DURATIONS.find(d => d.id === selected);
  const pm  = PAYMENT_METHODS.find(m => m.id === payment);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setStep("success");
      Animated.sequence([
        Animated.spring(doneScale, { toValue:1.15, useNativeDriver:true, damping:12, stiffness:180 }),
        Animated.spring(doneScale, { toValue:1,    useNativeDriver:true, damping:18, stiffness:200 }),
      ]).start();
      // Pin bounce loop
      const bounce = () => {
        Animated.sequence([
          Animated.timing(pinBounce, { toValue:-8, duration:300, useNativeDriver:true }),
          Animated.timing(pinBounce, { toValue:0,  duration:300, useNativeDriver:true }),
        ]).start(() => bounce());
      };
      setTimeout(bounce, 400);
    }, 1800);
  };

  // ── SUCCESS ─────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center", gap:0 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:20, transform:[{ scale: doneScale }] }}>
          <Animated.View style={[s.donePin, { transform:[{translateY: pinBounce}] }]}>
            <Ionicons name="pin" size={38} color="#fff" />
          </Animated.View>
          <Text style={s.doneTitle}>Listing Pinned!</Text>
          <View style={s.doneMeta}>
            <Text style={s.doneListingTitle} numberOfLines={1}>{listingTitle}</Text>
            <View style={s.doneRow}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={s.doneSub}>Pinned for {dur.label} · expires automatically</Text>
            </View>
            <View style={s.doneRow}>
              <Ionicons name="cash-outline" size={14} color="#15803D" />
              <Text style={[s.doneSub, { color:"#15803D", fontWeight:"700" }]}>₦{dur.price.toLocaleString()} charged to {pm.label}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.push("/seller-dashboard")}>
            <Text style={s.doneBtnTxt}>Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/listing/${listingId}`)}>
            <Text style={s.doneLinkTxt}>View my listing →</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── CONFIRM STEP ────────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep("choose")} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Confirm & Pay</Text>
          <View style={{ width:24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding:20, paddingBottom:120 }} showsVerticalScrollIndicator={false}>
          {/* Order summary */}
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>PINNING SUMMARY</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryKey}>Listing</Text>
              <Text style={s.summaryVal} numberOfLines={1}>{listingTitle}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryKey}>Duration</Text>
              <Text style={s.summaryVal}>{dur.label}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryKey}>Rate</Text>
              <Text style={s.summaryVal}>₦{dur.perDay}/day</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={[s.summaryKey, { fontWeight:"800", color:"#111827" }]}>Total</Text>
              <Text style={s.summaryTotal}>₦{dur.price.toLocaleString()}</Text>
            </View>
          </View>

          {/* Payment method */}
          <Text style={s.sectionLabel}>Payment Method</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.pmCard, payment === m.id && s.pmCardActive]}
              onPress={() => setPayment(m.id)}
              activeOpacity={0.88}
            >
              <View style={[s.pmIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={18} color={m.color} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.pmLabel}>{m.label}</Text>
                <Text style={s.pmSub}>{m.sub}</Text>
              </View>
              <View style={[s.radio, payment === m.id && s.radioActive]}>
                {payment === m.id && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Policy note */}
          <View style={s.policyNote}>
            <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
            <Text style={s.policyTxt}>
              Pinning fees are non-refundable. Your listing will automatically unpin after {dur.label}.
            </Text>
          </View>
        </ScrollView>

        <View style={s.cta}>
          <TouchableOpacity
            style={[s.ctaBtn, paying && s.ctaBtnLoading]}
            onPress={handlePay}
            disabled={paying}
            activeOpacity={0.88}
          >
            <Ionicons name={paying ? "hourglass-outline" : "pin"} size={16} color="#FCD34D" />
            <Text style={s.ctaTxt}>{paying ? "Processing…" : `Pay ₦${dur.price.toLocaleString()} & Pin`}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── CHOOSE STEP (default) ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pin Listing</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:120 }}
      >
        {/* Listing being pinned */}
        <View style={s.listingBanner}>
          <View style={s.listingBannerIcon}>
            <Ionicons name="pin" size={20} color="#1E3A8A" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.listingBannerLabel}>Pinning</Text>
            <Text style={s.listingBannerTitle} numberOfLines={1}>{listingTitle}</Text>
          </View>
        </View>

        {/* What pinning does */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What pinning does</Text>
          <View style={s.perksCard}>
            {PIN_PERKS.map((perk, i) => (
              <View key={i} style={[s.perkRow, i < PIN_PERKS.length - 1 && s.perkRowBorder]}>
                <View style={[s.perkIcon, { backgroundColor: perk.bg }]}>
                  <Ionicons name={perk.icon} size={16} color={perk.color} />
                </View>
                <Text style={s.perkTxt}>{perk.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Duration selector */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Choose duration</Text>
          {DURATIONS.map((d, i) => (
            <DurationCard key={d.id} d={d} index={i} selected={selected} onSelect={setSelected} />
          ))}
        </View>

        {/* Unlimited pins note */}
        <View style={s.noteCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#15803D" />
          <Text style={s.noteTxt}>You can pin multiple listings at the same time. No limit.</Text>
        </View>

      </Animated.ScrollView>

      <View style={s.cta}>
        <View style={s.ctaTop}>
          <Text style={s.ctaSummary}>Pinning for {dur.label}</Text>
          <Text style={s.ctaPrice}>₦{dur.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={s.ctaBtn} onPress={() => setStep("confirm")} activeOpacity={0.88}>
          <Ionicons name="pin" size={16} color="#FCD34D" />
          <Text style={s.ctaTxt}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },

  listingBanner: { flexDirection:"row", alignItems:"center", gap:12, margin:16, backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1.5, borderColor:"#BFDBFE" },
  listingBannerIcon: { width:44, height:44, borderRadius:22, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  listingBannerLabel: { fontSize:10, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 },
  listingBannerTitle: { fontSize:15, fontWeight:"800", color:"#111827", marginTop:2 },

  section: { paddingHorizontal:16, marginBottom:16, gap:12 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:"#111827" },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:10, marginHorizontal:20 },

  perksCard: { backgroundColor:"#fff", borderRadius:18, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden" },
  perkRow: { flexDirection:"row", alignItems:"flex-start", gap:12, padding:14 },
  perkRowBorder: { borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  perkIcon: { width:32, height:32, borderRadius:16, alignItems:"center", justifyContent:"center", marginTop:1 },
  perkTxt: { flex:1, fontSize:13, color:"#374151", lineHeight:20 },

  durCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:16, borderWidth:1.5, borderColor:"#E5E7EB", marginBottom:10 },
  durCardActive: { borderColor:"#1E3A8A", backgroundColor:"#F8FBFF" },
  durTop: { flexDirection:"row", alignItems:"center", gap:8 },
  durLabel: { fontSize:15, fontWeight:"700", color:"#111827" },
  durTag: { backgroundColor:"#F3F4F6", paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  durTagActive: { backgroundColor:"#DBEAFE" },
  durTagTxt: { fontSize:10, fontWeight:"700", color:"#6B7280" },
  durPer: { fontSize:11, color:"#9CA3AF", marginTop:3 },
  durPrice: { fontSize:18, fontWeight:"900", color:"#374151" },

  radio: { width:22, height:22, borderRadius:11, borderWidth:2, borderColor:"#D1D5DB", alignItems:"center", justifyContent:"center" },
  radioActive: { borderColor:"#1E3A8A" },
  radioDot: { width:10, height:10, borderRadius:5, backgroundColor:"#1E3A8A" },

  noteCard: { flexDirection:"row", alignItems:"center", gap:10, marginHorizontal:16, backgroundColor:"#F0FDF4", borderRadius:14, padding:14, borderWidth:1, borderColor:"#BBF7D0", marginBottom:8 },
  noteTxt: { flex:1, fontSize:12, color:"#15803D", lineHeight:18 },

  cta: { position:"absolute", bottom:0, left:0, right:0, padding:16, paddingBottom:Platform.OS==="ios"?32:16, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaTop: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  ctaSummary: { fontSize:13, color:"#6B7280", fontWeight:"600" },
  ctaPrice: { fontSize:18, fontWeight:"900", color:"#1E3A8A" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:14, elevation:10 },
  ctaBtnLoading: { backgroundColor:"#6B7280", shadowOpacity:0, elevation:0 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },

  summaryCard: { backgroundColor:"#fff", borderRadius:18, padding:18, borderWidth:1, borderColor:"#F3F4F6", marginBottom:20, gap:12 },
  summaryLabel: { fontSize:10, fontWeight:"800", color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase" },
  summaryRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  summaryKey: { fontSize:13, color:"#6B7280", fontWeight:"500" },
  summaryVal: { fontSize:13, fontWeight:"700", color:"#111827", maxWidth:"60%", textAlign:"right" },
  summaryTotal: { fontSize:20, fontWeight:"900", color:"#1E3A8A" },
  divider: { height:1, backgroundColor:"#F3F4F6" },

  pmCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1.5, borderColor:"#E5E7EB", marginHorizontal:16, marginBottom:10 },
  pmCardActive: { borderColor:"#1E3A8A", backgroundColor:"#F8FBFF" },
  pmIcon: { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center" },
  pmLabel: { fontSize:14, fontWeight:"700", color:"#111827" },
  pmSub: { fontSize:12, color:"#9CA3AF", marginTop:2 },

  policyNote: { flexDirection:"row", gap:8, marginHorizontal:16, marginTop:8, backgroundColor:"#F9FAFB", borderRadius:14, padding:12, borderWidth:1, borderColor:"#F3F4F6" },
  policyTxt: { flex:1, fontSize:11, color:"#9CA3AF", lineHeight:17 },

  donePin: { width:90, height:90, borderRadius:45, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:8}, shadowOpacity:0.35, shadowRadius:20, elevation:14 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827" },
  doneMeta: { backgroundColor:"#fff", borderRadius:20, padding:18, gap:10, borderWidth:1, borderColor:"#F3F4F6", width:"88%", alignItems:"center" },
  doneListingTitle: { fontSize:15, fontWeight:"800", color:"#111827" },
  doneRow: { flexDirection:"row", alignItems:"center", gap:8 },
  doneSub: { fontSize:13, color:"#6B7280" },
  doneBtn: { height:52, paddingHorizontal:36, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  doneBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  doneLinkTxt: { fontSize:13, color:"#1E3A8A", fontWeight:"600" },
});
