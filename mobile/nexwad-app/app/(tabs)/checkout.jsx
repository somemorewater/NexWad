// app/checkout.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CART_ITEMS = [
  { id:"c1", title:"Stroud Maths 7th Ed",    price:4500, qty:1, seller:"Ada O.",    imgBg:"#DBEAFE", imgIcon:"book-outline",  imgColor:"#1E3A8A" },
  { id:"c2", title:"HP 65W USB-C Charger",   price:6000, qty:1, seller:"Emeka B.", imgBg:"#FEF9C3", imgIcon:"flash-outline", imgColor:"#854D0E" },
];

const PAYMENT_METHODS = [
  { id:"pod",    label:"Pay on Delivery",  sub:"Pay cash when you receive your item",        icon:"cash-outline",        selected:true  },
  { id:"transfer",label:"Bank Transfer",  sub:"Transfer to seller's account directly",       icon:"swap-horizontal-outline", selected:false },
  { id:"card",   label:"Debit Card",       sub:"•••• •••• •••• 4521 · GTBank",               icon:"card-outline",        selected:false },
];

const STEPS = ["Delivery", "Payment", "Confirm"];

const Step = ({ step, current }) => {
  const done = step < current;
  const active = step === current;
  return (
    <View style={ST.wrap}>
      <View style={[ST.circle,
        done   && ST.circleDone,
        active && ST.circleActive,
      ]}>
        {done
          ? <Ionicons name="checkmark" size={13} color="#fff" />
          : <Text style={[ST.num, active && ST.numActive]}>{step + 1}</Text>
        }
      </View>
      <Text style={[ST.lbl, active && ST.lblActive, done && ST.lblDone]}>
        {STEPS[step]}
      </Text>
    </View>
  );
};
const ST = StyleSheet.create({
  wrap: { alignItems:"center", gap:4 },
  circle: { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#fff", alignItems:"center", justifyContent:"center" },
  circleActive: { borderColor:"#1E3A8A", backgroundColor:"#1E3A8A" },
  circleDone: { borderColor:"#15803D", backgroundColor:"#15803D" },
  num: { fontSize:12, fontWeight:"700", color:"#9CA3AF" },
  numActive: { color:"#fff" },
  lbl: { fontSize:10, fontWeight:"600", color:"#9CA3AF" },
  lblActive: { color:"#1E3A8A", fontWeight:"700" },
  lblDone: { color:"#15803D" },
});

export default function Checkout() {
  const [step,       setStep]       = useState(0);
  const [delivery,   setDelivery]   = useState("pickup"); // "pickup" | "campus"
  const [payMethod,  setPayMethod]  = useState("pod");
  const [placing,    setPlacing]    = useState(false);
  const [placed,     setPlaced]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const subtotal     = CART_ITEMS.reduce((a, i) => a + i.price * i.qty, 0);
  const deliveryFee  = delivery === "campus" ? 300 : 0;
  const total        = subtotal + deliveryFee;
  const fmt          = (n) => `₦${n.toLocaleString()}`;

  const placeOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      setPlaced(true);
      Animated.spring(successScale, { toValue:1, useNativeDriver:true, friction:4, tension:60 }).start();
    }, 1800);
  };

  // ── Success screen ──
  if (placed) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={s.successWrap}>
          <Animated.View style={[s.successCircle, { transform:[{scale:successScale}] }]}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </Animated.View>
          <Text style={s.successTitle}>Order Placed!</Text>
          <Text style={s.successSub}>
            Your order has been sent to the seller.{"\n"}They'll confirm and arrange pickup.
          </Text>
          <View style={s.successMeta}>
            <Text style={s.successMetaLabel}>Total paid</Text>
            <Text style={s.successMetaValue}>{fmt(total)}</Text>
          </View>
          <TouchableOpacity style={s.trackBtn} onPress={() => { router.replace("/orders"); }}>
            <Text style={s.trackBtnTxt}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backHomeBtn} onPress={() => router.replace("/(tabs)/feed")}>
            <Text style={s.backHomeTxt}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width:24 }} />
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        {STEPS.map((_, i) => (
          <React.Fragment key={i}>
            <Step step={i} current={step} />
            {i < STEPS.length - 1 && (
              <View style={[s.stepLine, i < step && s.stepLineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:20, paddingBottom:110 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── STEP 0: Delivery ── */}
        {step === 0 && (
          <View>
            <Text style={s.sectionTitle}>How do you want to receive it?</Text>

            {[
              { id:"pickup", label:"Self Pickup",       sub:"Meet the seller at an agreed campus location.",  icon:"walk-outline",    badge:null         },
              { id:"campus", label:"Campus Delivery",   sub:"Seller delivers to your block · ₦300 flat fee.", icon:"bicycle-outline", badge:"Recommended"},
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[s.optionCard, delivery === opt.id && s.optionCardOn]}
                onPress={() => setDelivery(opt.id)}
              >
                <View style={[s.optionIcon, delivery === opt.id && { backgroundColor:"#1E3A8A" }]}>
                  <Ionicons name={opt.icon} size={20} color={delivery === opt.id ? "#fff" : "#374151"} />
                </View>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:7 }}>
                    <Text style={[s.optionLabel, delivery === opt.id && { color:"#1E3A8A" }]}>{opt.label}</Text>
                    {opt.badge && <View style={s.recBadge}><Text style={s.recBadgeTxt}>{opt.badge}</Text></View>}
                  </View>
                  <Text style={s.optionSub}>{opt.sub}</Text>
                </View>
                <View style={[s.radio, delivery === opt.id && s.radioOn]}>
                  {delivery === opt.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Location input */}
            {delivery === "campus" && (
              <View style={s.locationCard}>
                <Ionicons name="location-outline" size={16} color="#1E3A8A" />
                <View style={{ flex:1 }}>
                  <Text style={s.locationLabel}>Delivery Location</Text>
                  <Text style={s.locationValue}>Block C, Room 14, Female Hostel</Text>
                </View>
                <TouchableOpacity>
                  <Text style={s.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Order items */}
            <Text style={[s.sectionTitle, { marginTop:24 }]}>Items ({CART_ITEMS.length})</Text>
            {CART_ITEMS.map(item => (
              <View key={item.id} style={s.itemRow}>
                <View style={[s.itemImg, { backgroundColor:item.imgBg }]}>
                  <Ionicons name={item.imgIcon} size={18} color={item.imgColor} style={{ opacity:0.5 }} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.itemSeller}>from {item.seller}</Text>
                </View>
                <Text style={s.itemPrice}>{fmt(item.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── STEP 1: Payment ── */}
        {step === 1 && (
          <View>
            <Text style={s.sectionTitle}>Choose payment method</Text>
            {PAYMENT_METHODS.map(pm => (
              <TouchableOpacity
                key={pm.id}
                style={[s.optionCard, payMethod === pm.id && s.optionCardOn]}
                onPress={() => setPayMethod(pm.id)}
              >
                <View style={[s.optionIcon, payMethod === pm.id && { backgroundColor:"#1E3A8A" }]}>
                  <Ionicons name={pm.icon} size={20} color={payMethod === pm.id ? "#fff" : "#374151"} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[s.optionLabel, payMethod === pm.id && { color:"#1E3A8A" }]}>{pm.label}</Text>
                  <Text style={s.optionSub}>{pm.sub}</Text>
                </View>
                <View style={[s.radio, payMethod === pm.id && s.radioOn]}>
                  {payMethod === pm.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.addPaymentBtn} onPress={() => router.push("/payments")}>
              <Ionicons name="add-circle-outline" size={18} color="#1E3A8A" />
              <Text style={s.addPaymentTxt}>Add new payment method</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 2 && (
          <View>
            <Text style={s.sectionTitle}>Order Summary</Text>

            {/* Items */}
            <View style={s.summaryCard}>
              {CART_ITEMS.map((item, i) => (
                <View key={item.id} style={[s.summaryRow, i < CART_ITEMS.length - 1 && { borderBottomWidth:1, borderBottomColor:"#F9FAFB", paddingBottom:10, marginBottom:10 }]}>
                  <View style={[s.itemImg, { backgroundColor:item.imgBg }]}>
                    <Ionicons name={item.imgIcon} size={16} color={item.imgColor} style={{ opacity:0.5 }} />
                  </View>
                  <Text style={s.summaryItemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.summaryItemPrice}>{fmt(item.price)}</Text>
                </View>
              ))}
            </View>

            {/* Delivery & payment */}
            <View style={s.confirmMeta}>
              <View style={s.confirmMetaRow}>
                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                <Text style={s.confirmMetaLabel}>{delivery === "campus" ? "Campus Delivery · Block C" : "Self Pickup"}</Text>
              </View>
              <View style={s.confirmMetaRow}>
                <Ionicons name="card-outline" size={14} color="#9CA3AF" />
                <Text style={s.confirmMetaLabel}>{PAYMENT_METHODS.find(p => p.id === payMethod)?.label}</Text>
              </View>
            </View>

            {/* Totals */}
            <View style={s.totalsCard}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmt(subtotal)}</Text>
              </View>
              {deliveryFee > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Delivery fee</Text>
                  <Text style={s.totalValue}>{fmt(deliveryFee)}</Text>
                </View>
              )}
              <View style={[s.totalRow, s.totalRowFinal]}>
                <Text style={s.totalLabelFinal}>Total</Text>
                <Text style={s.totalValueFinal}>{fmt(total)}</Text>
              </View>
            </View>

            {/* Trust note */}
            <View style={s.trustNote}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#15803D" />
              <Text style={s.trustTxt}>Your order is protected. Only transact with verified AFIT students.</Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        {step < 2 ? (
          <TouchableOpacity style={s.nextBtn} onPress={() => setStep(s => s + 1)}>
            <Text style={s.nextBtnTxt}>Continue</Text>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, placing && { opacity:0.7 }]} onPress={placeOrder} disabled={placing}>
            {placing
              ? <Text style={s.nextBtnTxt}>Placing order…</Text>
              : <>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
                  <Text style={s.nextBtnTxt}>Place Order · {fmt(total)}</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  stepRow: { flexDirection:"row", alignItems:"center", justifyContent:"center", paddingVertical:16, paddingHorizontal:24, borderBottomWidth:1, borderBottomColor:"#F3F4F6", gap:0 },
  stepLine: { flex:1, height:2, backgroundColor:"#E5E7EB", marginBottom:14 },
  stepLineDone: { backgroundColor:"#15803D" },
  sectionTitle: { fontSize:15, fontWeight:"800", color:"#111827", marginBottom:14 },
  optionCard: { flexDirection:"row", alignItems:"center", gap:14, borderWidth:1.5, borderColor:"#E5E7EB", borderRadius:18, padding:14, marginBottom:12, backgroundColor:"#FAFAFA" },
  optionCardOn: { borderColor:"#1E3A8A", backgroundColor:"#F0F6FF" },
  optionIcon: { width:44, height:44, borderRadius:14, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  optionLabel: { fontSize:14, fontWeight:"700", color:"#111827", marginBottom:2 },
  optionSub: { fontSize:12, color:"#9CA3AF" },
  recBadge: { backgroundColor:"#F0FDF4", paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  recBadgeTxt: { fontSize:9, fontWeight:"800", color:"#15803D" },
  radio: { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:"#D1D5DB", alignItems:"center", justifyContent:"center" },
  radioOn: { borderColor:"#1E3A8A" },
  radioDot: { width:10, height:10, borderRadius:5, backgroundColor:"#1E3A8A" },
  locationCard: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#EFF6FF", borderRadius:16, padding:13, borderWidth:1, borderColor:"#BFDBFE", marginTop:4 },
  locationLabel: { fontSize:10, fontWeight:"600", color:"#3B82F6", textTransform:"uppercase", letterSpacing:0.5 },
  locationValue: { fontSize:13, fontWeight:"600", color:"#1E3A8A", marginTop:1 },
  changeLink: { fontSize:12, fontWeight:"700", color:"#F97316" },
  itemRow: { flexDirection:"row", alignItems:"center", gap:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  itemImg: { width:40, height:40, borderRadius:12, alignItems:"center", justifyContent:"center" },
  itemTitle: { fontSize:13, fontWeight:"600", color:"#111827" },
  itemSeller: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  itemPrice: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  addPaymentBtn: { flexDirection:"row", alignItems:"center", gap:8, borderWidth:1.5, borderColor:"#BFDBFE", borderRadius:16, padding:14, borderStyle:"dashed" },
  addPaymentTxt: { fontSize:14, fontWeight:"600", color:"#1E3A8A" },
  summaryCard: { backgroundColor:"#F9FAFB", borderRadius:18, padding:14, marginBottom:14, borderWidth:1, borderColor:"#F3F4F6" },
  summaryRow: { flexDirection:"row", alignItems:"center", gap:10 },
  summaryItemTitle: { flex:1, fontSize:13, fontWeight:"600", color:"#111827" },
  summaryItemPrice: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  confirmMeta: { backgroundColor:"#F9FAFB", borderRadius:16, padding:13, gap:8, marginBottom:14, borderWidth:1, borderColor:"#F3F4F6" },
  confirmMetaRow: { flexDirection:"row", alignItems:"center", gap:8 },
  confirmMetaLabel: { fontSize:13, color:"#374151", fontWeight:"500" },
  totalsCard: { backgroundColor:"#fff", borderRadius:18, padding:16, borderWidth:1, borderColor:"#F3F4F6", marginBottom:14 },
  totalRow: { flexDirection:"row", justifyContent:"space-between", paddingVertical:6 },
  totalRowFinal: { borderTopWidth:1, borderTopColor:"#F3F4F6", marginTop:6, paddingTop:12 },
  totalLabel: { fontSize:13, color:"#6B7280" },
  totalValue: { fontSize:13, color:"#374151", fontWeight:"500" },
  totalLabelFinal: { fontSize:15, fontWeight:"800", color:"#111827" },
  totalValueFinal: { fontSize:18, fontWeight:"900", color:"#1E3A8A" },
  trustNote: { flexDirection:"row", gap:8, backgroundColor:"#F0FDF4", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BBF7D0" },
  trustTxt: { flex:1, fontSize:12, color:"#15803D", lineHeight:18 },
  cta: { position:"absolute", bottom:0, left:0, right:0, padding:16, paddingBottom:Platform.OS==="ios"?32:16, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  nextBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  nextBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  // Success
  successWrap: { flex:1, alignItems:"center", justifyContent:"center", padding:32, gap:14 },
  successCircle: { width:88, height:88, borderRadius:44, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center", shadowColor:"#15803D", shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:16, elevation:12, marginBottom:8 },
  successTitle: { fontSize:26, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  successSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:22 },
  successMeta: { backgroundColor:"#F9FAFB", borderRadius:16, paddingHorizontal:24, paddingVertical:14, alignItems:"center", borderWidth:1, borderColor:"#F3F4F6", marginTop:4 },
  successMetaLabel: { fontSize:11, color:"#9CA3AF", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5, fontWeight:"600" },
  successMetaValue: { fontSize:24, fontWeight:"900", color:"#1E3A8A" },
  trackBtn: { width:"100%", height:52, borderRadius:16, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginTop:8 },
  trackBtnTxt: { fontSize:15, fontWeight:"700", color:"#fff" },
  backHomeBtn: { paddingVertical:10 },
  backHomeTxt: { fontSize:14, color:"#9CA3AF", fontWeight:"500" },
});
