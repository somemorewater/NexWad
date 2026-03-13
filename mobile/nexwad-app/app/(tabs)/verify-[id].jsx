// app/verify/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STEP_CONFIG = {
  phone: {
    title:       "Verify Phone Number",
    sub:         "We'll send a one-time code to confirm your number.",
    icon:        "phone-portrait-outline",
    inputLabel:  "Phone Number",
    placeholder: "0812 345 6789",
    keyboard:    "phone-pad",
    ctaLabel:    "Send Code",
    hasOtp:      true,
  },
  payment: {
    title:       "Add Payment Method",
    sub:         "Add a bank account or card to receive payments from buyers.",
    icon:        "card-outline",
    inputLabel:  "Account Number",
    placeholder: "0123 456 789",
    keyboard:    "number-pad",
    ctaLabel:    "Verify Account",
    hasOtp:      false,
  },
  email: {
    title:       "Confirm AFIT Email",
    sub:         "We'll send a confirmation link to your AFIT email address.",
    icon:        "mail-outline",
    inputLabel:  "AFIT Email",
    placeholder: "yourname@afit.edu.ng",
    keyboard:    "email-address",
    ctaLabel:    "Send Confirmation",
    hasOtp:      true,
  },
  photo: {
    title:       "Upload Student ID",
    sub:         "Take a clear photo of your AFIT student ID card.",
    icon:        "id-card-outline",
    inputLabel:  null,
    placeholder: null,
    keyboard:    "default",
    ctaLabel:    "Upload Photo",
    hasOtp:      false,
    isPhoto:     true,
  },
};

export default function VerifyStep() {
  const { id } = useLocalSearchParams();
  const config   = STEP_CONFIG[id] || STEP_CONFIG.phone;

  const [stepPhase, setStepPhase] = useState("input"); // "input" | "otp" | "done"
  const [value,     setValue]     = useState("");
  const [otp,       setOtp]       = useState(["","","","",""]);
  const [loading,   setLoading]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    // In production: trigger resend API call here
  };

  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(20)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const otpRefs      = [useRef(), useRef(), useRef(), useRef(), useRef()];

  const animateIn = () => {
    fadeAnim.setValue(0); slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:360, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:360, useNativeDriver:true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, [stepPhase]);

  const handlePrimary = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (config.hasOtp) { setStepPhase("otp"); setResendCooldown(30); }
      else { setStepPhase("done"); Animated.spring(successScale, { toValue:1, useNativeDriver:true, friction:4, tension:60 }).start(); }
    }, 1200);
  };

  const handleOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 4) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
    if (next.every(d => d) && val) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStepPhase("done");
        Animated.spring(successScale, { toValue:1, useNativeDriver:true, friction:4, tension:60 }).start();
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":undefined}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => stepPhase==="otp" ? setStepPhase("input") : router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Verification</Text>
          <View style={{ width:24 }} />
        </View>

        <Animated.View style={[s.body, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>

          {/* Input phase */}
          {stepPhase === "input" && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name={config.icon} size={30} color="#1E3A8A" />
              </View>
              <Text style={s.title}>{config.title}</Text>
              <Text style={s.sub}>{config.sub}</Text>

              {config.isPhoto ? (
                <TouchableOpacity style={s.photoBox}>
                  <Ionicons name="camera-outline" size={36} color="#9CA3AF" />
                  <Text style={s.photoBoxTxt}>Tap to take photo or upload</Text>
                  <Text style={s.photoBoxSub}>JPG or PNG · Max 5MB</Text>
                </TouchableOpacity>
              ) : config.inputLabel ? (
                <View style={{ gap:6, marginBottom:24 }}>
                  <Text style={s.inputLabel}>{config.inputLabel}</Text>
                  <View style={s.inputWrap}>
                    <Ionicons name={config.icon} size={17} color="#9CA3AF" />
                    <TextInput
                      style={s.input}
                      placeholder={config.placeholder}
                      placeholderTextColor="#D1D5DB"
                      value={value}
                      onChangeText={setValue}
                      keyboardType={config.keyboard}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.btn, (!value && !config.isPhoto && !!config.inputLabel) && s.btnOff, loading && s.btnOff]}
                onPress={handlePrimary}
                disabled={loading || (!value && !config.isPhoto && !!config.inputLabel)}
              >
                <Text style={s.btnTxt}>{loading ? "Please wait…" : config.ctaLabel}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* OTP phase */}
          {stepPhase === "otp" && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name="keypad-outline" size={30} color="#1E3A8A" />
              </View>
              <Text style={s.title}>Enter the Code</Text>
              <Text style={s.sub}>A 5-digit code was sent to <Text style={{ fontWeight:"700", color:"#111827" }}>{value}</Text></Text>
              <View style={s.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={otpRefs[i]}
                    style={[s.otpBox, digit && s.otpBoxFilled]}
                    value={digit}
                    onChangeText={val => handleOtp(val.slice(-1), i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>
              {loading && <Text style={s.verifyingTxt}>Verifying…</Text>}
              <TouchableOpacity style={s.resendRow} onPress={handleResend} disabled={resendCooldown > 0}>
                <Text style={s.resendTxt}>Didn't receive it? </Text>
                <Text style={[s.resendLink, resendCooldown > 0 && { color:"#9CA3AF" }]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Done */}
          {stepPhase === "done" && (
            <View style={s.doneWrap}>
              <Animated.View style={[s.doneCircle, { transform:[{scale:successScale}] }]}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </Animated.View>
              <Text style={s.doneTitle}>Verified!</Text>
              <Text style={s.doneSub}>{config.title.replace("Verify","").replace("Confirm","").replace("Upload","").trim()} has been successfully verified.</Text>
              <TouchableOpacity style={[s.btn, { marginTop:24 }]} onPress={() => router.back()}>
                <Text style={s.btnTxt}>Back to Verification</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  body: { flex:1, paddingHorizontal:28, paddingTop:32, paddingBottom:40 },
  iconWrap: { width:66, height:66, borderRadius:22, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", marginBottom:20 },
  title: { fontSize:24, fontWeight:"900", color:"#111827", letterSpacing:-0.4, marginBottom:10 },
  sub: { fontSize:14, color:"#6B7280", lineHeight:22, marginBottom:28 },
  inputLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 },
  inputWrap: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#F3F4F6", borderRadius:16, paddingHorizontal:14, height:52 },
  input: { flex:1, fontSize:15, color:"#111827" },
  photoBox: { alignItems:"center", justifyContent:"center", gap:8, backgroundColor:"#F9FAFB", borderRadius:20, padding:32, borderWidth:1.5, borderColor:"#E5E7EB", borderStyle:"dashed", marginBottom:24 },
  photoBoxTxt: { fontSize:14, fontWeight:"600", color:"#374151" },
  photoBoxSub: { fontSize:12, color:"#9CA3AF" },
  btn: { height:54, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  btnOff: { backgroundColor:"#93C5FD", shadowOpacity:0 },
  btnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  otpRow: { flexDirection:"row", gap:10, justifyContent:"center", marginBottom:16 },
  otpBox: { width:52, height:58, borderRadius:16, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", fontSize:22, fontWeight:"800", color:"#111827", textAlign:"center" },
  otpBoxFilled: { borderColor:"#1E3A8A", backgroundColor:"#EFF6FF" },
  verifyingTxt: { textAlign:"center", fontSize:13, color:"#9CA3AF", marginBottom:12 },
  resendRow: { flexDirection:"row", justifyContent:"center", marginTop:8 },
  resendTxt: { fontSize:13, color:"#9CA3AF" },
  resendLink: { fontSize:13, fontWeight:"700", color:"#1E3A8A" },
  doneWrap: { flex:1, alignItems:"center", justifyContent:"center", gap:12 },
  doneCircle: { width:88, height:88, borderRadius:44, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center", marginBottom:8, shadowColor:"#15803D", shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:16, elevation:12 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:22 },
});
