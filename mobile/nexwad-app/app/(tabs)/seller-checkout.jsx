// app/seller-checkout.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ─── TIER META ────────────────────────────────────────────────────────────────
const TIERS = {
  basic: { label:"Basic Seller",   price:2000,  accent:"#0369A1", icon:"storefront-outline",  badge:"BASIC"   },
  pro:   { label:"Pro Seller",     price:3000,  accent:"#1E3A8A", icon:"ribbon-outline",       badge:"PRO"     },
  elite: { label:"Elite Seller",   price:6000,  accent:"#7C3AED", icon:"diamond-outline",      badge:"ELITE"   },
};

const PAYMENT_METHODS = [
  { id:"transfer", label:"Bank Transfer",  sub:"Transfer to Nexwad's account",        icon:"swap-horizontal-outline" },
  { id:"card",     label:"Debit / Credit Card", sub:"Pay securely with your card",    icon:"card-outline"            },
  { id:"ussd",     label:"USSD",           sub:"Dial a code on your phone",           icon:"phone-portrait-outline"  },
];

const STEPS = ["Plan", "Payment", "Confirm"];

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <View style={sb.wrap}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={sb.item}>
              <View style={[sb.circle, done && sb.done, active && sb.active]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[sb.num, active && sb.numActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[sb.lbl, active && sb.lblActive, done && sb.lblDone]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sb.line, done && sb.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:      { flexDirection:"row", alignItems:"center", paddingHorizontal:24, paddingVertical:14, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  item:      { alignItems:"center", gap:4 },
  circle:    { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#fff", alignItems:"center", justifyContent:"center" },
  active:    { borderColor:"#1E3A8A", backgroundColor:"#1E3A8A" },
  done:      { borderColor:"#15803D", backgroundColor:"#15803D" },
  num:       { fontSize:11, fontWeight:"700", color:"#9CA3AF" },
  numActive: { color:"#fff" },
  lbl:       { fontSize:10, fontWeight:"600", color:"#9CA3AF" },
  lblActive: { color:"#1E3A8A", fontWeight:"800" },
  lblDone:   { color:"#15803D" },
  line:      { flex:1, height:2, backgroundColor:"#E5E7EB", marginBottom:14 },
  lineDone:  { backgroundColor:"#15803D" },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function SellerCheckout() {
  const params    = useLocalSearchParams();
  const tierKey   = params.tier || "pro";
  const tier      = TIERS[tierKey] || TIERS.pro;

  const [step,      setStep]      = useState(0);
  const [payMethod, setPayMethod] = useState("transfer");
  const [cardNum,   setCardNum]   = useState("");
  const [cardName,  setCardName]  = useState("");
  const [cardExp,   setCardExp]   = useState("");
  const [cardCvv,   setCardCvv]   = useState("");
  const [placing,   setPlacing]   = useState(false);
  const [placed,    setPlaced]    = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(20)).current;
  const successScale= useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const fmt = (n) => `₦${n.toLocaleString()}`;

  const handlePay = () => {
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      setPlaced(true);
      Animated.spring(successScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.replace("/seller-setup"), 2200);
    }, 1800);
  };

  // ── SUCCESS OVERLAY ─────────────────────────────────────────────────────────
  if (placed) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <Animated.View style={[s.successBox, { transform:[{ scale: successScale }] }]}>
          <View style={s.successCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={s.successTitle}>Payment Confirmed!</Text>
          <Text style={s.successSub}>Setting up your seller account…</Text>
          <View style={[s.tierPill, { backgroundColor: tier.accent + "18", borderColor: tier.accent + "40" }]}>
            <Ionicons name={tier.icon} size={14} color={tier.accent} />
            <Text style={[s.tierPillTxt, { color: tier.accent }]}>{tier.label}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Become a Seller</Text>
        <View style={{ width:24 }} />
      </View>

      <StepBar current={step} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* ── STEP 0: PLAN REVIEW ─────────────────────────────────────────── */}
          {step === 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Your Plan</Text>

              {/* Tier card */}
              <View style={[s.planCard, { borderColor: tier.accent + "50", backgroundColor: tier.accent + "0D" }]}>
                <View style={[s.planIconWrap, { backgroundColor: tier.accent }]}>
                  <Ionicons name={tier.icon} size={24} color="#fff" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[s.planLabel, { color: tier.accent }]}>{tier.label}</Text>
                  <Text style={s.planSub}>Billed monthly · Cancel anytime</Text>
                </View>
                <View>
                  <Text style={[s.planPrice, { color: tier.accent }]}>{fmt(tier.price)}</Text>
                  <Text style={s.planPriceSub}>/month</Text>
                </View>
              </View>

              {/* What's included */}
              <Text style={s.sectionTitle}>What's included</Text>
              {tierKey === "basic" && ["Up to 10 active listings","Standard visibility","Basic analytics","Customer reviews"].map(f => (
                <View key={f} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#0369A1" />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
              {tierKey === "pro" && ["Up to 30 active listings","Pin up to 2 listings","Boosted feed visibility","Advanced analytics","Pro seller badge"].map(f => (
                <View key={f} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
              {tierKey === "elite" && ["Unlimited active listings","Pin up to 5 listings","Highest feed priority","Full analytics dashboard","Premium seller badge","Featured placement opportunities"].map(f => (
                <View key={f} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#7C3AED" />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}

              {/* Admin note */}
              <View style={s.adminNote}>
                <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
                <Text style={s.adminNoteTxt}>Your seller account requires admin approval. You'll be notified within 24 hours of payment.</Text>
              </View>

              {/* Summary */}
              <View style={s.summaryBox}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Subscription</Text>
                  <Text style={s.summaryVal}>{fmt(tier.price)}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Billing cycle</Text>
                  <Text style={s.summaryVal}>Monthly</Text>
                </View>
                <View style={[s.summaryRow, s.summaryTotal]}>
                  <Text style={s.summaryTotalLabel}>Total today</Text>
                  <Text style={[s.summaryTotalVal, { color: tier.accent }]}>{fmt(tier.price)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 1: PAYMENT METHOD ──────────────────────────────────────── */}
          {step === 1 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Choose Payment Method</Text>

              {PAYMENT_METHODS.map(pm => (
                <TouchableOpacity
                  key={pm.id}
                  style={[s.pmCard, payMethod===pm.id && s.pmCardOn]}
                  onPress={() => setPayMethod(pm.id)}
                  activeOpacity={0.85}
                >
                  <View style={[s.pmIcon, payMethod===pm.id && s.pmIconOn]}>
                    <Ionicons name={pm.icon} size={20} color={payMethod===pm.id?"#1E3A8A":"#6B7280"} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={[s.pmLabel, payMethod===pm.id && { color:"#1E3A8A", fontWeight:"700" }]}>{pm.label}</Text>
                    <Text style={s.pmSub}>{pm.sub}</Text>
                  </View>
                  <View style={[s.pmRadio, payMethod===pm.id && s.pmRadioOn]}>
                    {payMethod===pm.id && <View style={s.pmRadioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Card fields */}
              {payMethod === "card" && (
                <View style={s.cardFields}>
                  <Text style={s.fieldLabel}>Card Number</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNum}
                    onChangeText={t => setCardNum(t.replace(/[^0-9]/g,"").replace(/(.{4})/g,"$1 ").trim())}
                  />
                  <Text style={s.fieldLabel}>Cardholder Name</Text>
                  <TextInput
                    style={s.fieldInput}
                    placeholder="Full name on card"
                    placeholderTextColor="#9CA3AF"
                    value={cardName}
                    onChangeText={setCardName}
                  />
                  <View style={{ flexDirection:"row", gap:12 }}>
                    <View style={{ flex:1 }}>
                      <Text style={s.fieldLabel}>Expiry</Text>
                      <TextInput
                        style={s.fieldInput}
                        placeholder="MM / YY"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={7}
                        value={cardExp}
                        onChangeText={setCardExp}
                      />
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={s.fieldLabel}>CVV</Text>
                      <TextInput
                        style={s.fieldInput}
                        placeholder="•••"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Transfer instructions */}
              {payMethod === "transfer" && (
                <View style={s.transferBox}>
                  <Text style={s.transferTitle}>Bank Transfer Details</Text>
                  <View style={s.transferRow}><Text style={s.transferKey}>Bank</Text><Text style={s.transferVal}>GTBank</Text></View>
                  <View style={s.transferRow}><Text style={s.transferKey}>Account Name</Text><Text style={s.transferVal}>Nexwad Technologies</Text></View>
                  <View style={s.transferRow}><Text style={s.transferKey}>Account No.</Text><Text style={s.transferVal}>0123456789</Text></View>
                  <View style={s.transferRow}><Text style={s.transferKey}>Amount</Text><Text style={[s.transferVal, { color:"#1E3A8A", fontWeight:"800" }]}>{fmt(tier.price)}</Text></View>
                  <Text style={s.transferNote}>Use your name as payment reference. Tap "Confirm Payment" once transferred.</Text>
                </View>
              )}

              {/* USSD */}
              {payMethod === "ussd" && (
                <View style={s.transferBox}>
                  <Text style={s.transferTitle}>USSD Payment</Text>
                  <Text style={s.ussdCode}>*737*{tier.price}*9#</Text>
                  <Text style={s.transferNote}>Dial the code above on your registered mobile number. Tap "Confirm Payment" once done.</Text>
                </View>
              )}

              {/* Order summary strip */}
              <View style={s.miniSummary}>
                <Text style={s.miniSummaryLabel}>Total due</Text>
                <Text style={[s.miniSummaryVal, { color: tier.accent }]}>{fmt(tier.price)}/month</Text>
              </View>
            </View>
          )}

          {/* ── STEP 2: CONFIRM ─────────────────────────────────────────────── */}
          {step === 2 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Confirm & Pay</Text>

              <View style={[s.confirmCard, { borderColor: tier.accent + "40" }]}>
                <View style={s.confirmRow}>
                  <Text style={s.confirmKey}>Plan</Text>
                  <View style={[s.confirmBadge, { backgroundColor: tier.accent + "18" }]}>
                    <Text style={[s.confirmBadgeTxt, { color: tier.accent }]}>{tier.label}</Text>
                  </View>
                </View>
                <View style={s.confirmRow}>
                  <Text style={s.confirmKey}>Payment method</Text>
                  <Text style={s.confirmVal}>{PAYMENT_METHODS.find(p=>p.id===payMethod)?.label}</Text>
                </View>
                <View style={s.confirmRow}>
                  <Text style={s.confirmKey}>Billing</Text>
                  <Text style={s.confirmVal}>Monthly</Text>
                </View>
                <View style={[s.confirmRow, { borderTopWidth:1, borderTopColor:"#F3F4F6", marginTop:8, paddingTop:12 }]}>
                  <Text style={[s.confirmKey, { fontWeight:"800", color:"#111827" }]}>Total charged</Text>
                  <Text style={[s.confirmVal, { fontWeight:"900", color: tier.accent, fontSize:16 }]}>{fmt(tier.price)}</Text>
                </View>
              </View>

              <View style={s.termsNote}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                <Text style={s.termsTxt}>
                  By confirming, you agree to Nexwad's seller terms. Subscription renews monthly until cancelled.
                </Text>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        {step < 2 ? (
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: tier.accent, shadowColor: tier.accent }]}
            onPress={() => setStep(s => s + 1)}
          >
            <Text style={s.ctaTxt}>{step === 0 ? "Continue to Payment" : "Review Order"}</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: tier.accent, shadowColor: tier.accent, opacity: placing ? 0.7 : 1 }]}
            onPress={handlePay}
            disabled={placing}
          >
            {placing
              ? <Text style={s.ctaTxt}>Processing…</Text>
              : <>
                  <Ionicons name="lock-closed-outline" size={16} color="#FCD34D" />
                  <Text style={s.ctaTxt}>Confirm Payment — {fmt(tier.price)}</Text>
                </>
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop:10, alignItems:"center" }}>
          <Text style={s.skipTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },

  section: { padding:16, gap:12 },
  sectionTitle: { fontSize:13, fontWeight:"800", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.8, marginTop:4 },

  // Plan card
  planCard: { flexDirection:"row", alignItems:"center", gap:14, borderRadius:20, borderWidth:1.5, padding:16 },
  planIconWrap: { width:46, height:46, borderRadius:23, alignItems:"center", justifyContent:"center" },
  planLabel: { fontSize:16, fontWeight:"900", letterSpacing:-0.3 },
  planSub: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  planPrice: { fontSize:20, fontWeight:"900", textAlign:"right", letterSpacing:-0.5 },
  planPriceSub: { fontSize:11, color:"#9CA3AF", textAlign:"right" },

  featureRow: { flexDirection:"row", alignItems:"center", gap:10 },
  featureText: { fontSize:13, color:"#374151", fontWeight:"500" },

  adminNote: { flexDirection:"row", gap:9, backgroundColor:"#EFF6FF", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BFDBFE" },
  adminNoteTxt: { flex:1, fontSize:12, color:"#1D4ED8", lineHeight:18 },

  summaryBox: { borderRadius:16, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden" },
  summaryRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:14, paddingVertical:11, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  summaryLabel: { fontSize:13, color:"#6B7280" },
  summaryVal: { fontSize:13, color:"#374151", fontWeight:"600" },
  summaryTotal: { backgroundColor:"#F9FAFB", borderBottomWidth:0 },
  summaryTotalLabel: { fontSize:14, fontWeight:"800", color:"#111827" },
  summaryTotalVal: { fontSize:16, fontWeight:"900" },

  // Payment methods
  pmCard: { flexDirection:"row", alignItems:"center", gap:14, borderRadius:18, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", padding:14 },
  pmCardOn: { borderColor:"#1E3A8A", backgroundColor:"#EFF6FF" },
  pmIcon: { width:42, height:42, borderRadius:21, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  pmIconOn: { backgroundColor:"#DBEAFE" },
  pmLabel: { fontSize:14, fontWeight:"600", color:"#374151" },
  pmSub: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  pmRadio: { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:"#D1D5DB", alignItems:"center", justifyContent:"center" },
  pmRadioOn: { borderColor:"#1E3A8A" },
  pmRadioDot: { width:10, height:10, borderRadius:5, backgroundColor:"#1E3A8A" },

  // Card fields
  cardFields: { backgroundColor:"#F9FAFB", borderRadius:18, padding:14, gap:8, borderWidth:1, borderColor:"#E5E7EB" },
  fieldLabel: { fontSize:11, fontWeight:"700", color:"#6B7280", textTransform:"uppercase", letterSpacing:0.5 },
  fieldInput: { height:46, borderRadius:12, borderWidth:1, borderColor:"#E5E7EB", backgroundColor:"#fff", paddingHorizontal:14, fontSize:14, color:"#111827" },

  // Transfer / USSD
  transferBox: { backgroundColor:"#F0F9FF", borderRadius:18, padding:16, borderWidth:1, borderColor:"#BAE6FD", gap:8 },
  transferTitle: { fontSize:14, fontWeight:"800", color:"#0369A1", marginBottom:4 },
  transferRow: { flexDirection:"row", justifyContent:"space-between" },
  transferKey: { fontSize:12, color:"#6B7280" },
  transferVal: { fontSize:12, color:"#111827", fontWeight:"600" },
  transferNote: { fontSize:11, color:"#0369A1", lineHeight:17, marginTop:4 },
  ussdCode: { fontSize:26, fontWeight:"900", color:"#0369A1", textAlign:"center", letterSpacing:1, paddingVertical:8 },

  miniSummary: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", backgroundColor:"#F9FAFB", borderRadius:14, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  miniSummaryLabel: { fontSize:13, color:"#6B7280", fontWeight:"600" },
  miniSummaryVal: { fontSize:15, fontWeight:"900" },

  // Confirm step
  confirmCard: { borderRadius:20, borderWidth:1.5, padding:16, gap:0 },
  confirmRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10 },
  confirmKey: { fontSize:13, color:"#6B7280" },
  confirmVal: { fontSize:13, color:"#374151", fontWeight:"600" },
  confirmBadge: { paddingHorizontal:10, paddingVertical:4, borderRadius:10 },
  confirmBadgeTxt: { fontSize:12, fontWeight:"800" },

  termsNote: { flexDirection:"row", gap:8, backgroundColor:"#F9FAFB", borderRadius:14, padding:12 },
  termsTxt: { flex:1, fontSize:11, color:"#9CA3AF", lineHeight:17 },

  // CTA
  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  skipTxt: { fontSize:13, color:"#9CA3AF", textAlign:"center" },

  // Success
  successBox: { alignItems:"center", gap:16, padding:32 },
  successCircle: { width:80, height:80, borderRadius:40, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center", marginBottom:4 },
  successTitle: { fontSize:24, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  successSub: { fontSize:14, color:"#6B7280" },
  tierPill: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:14, paddingVertical:7, borderRadius:14, borderWidth:1 },
  tierPillTxt: { fontSize:13, fontWeight:"800" },
});
