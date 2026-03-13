// app/forgot-password.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STEPS = ["email", "otp", "reset", "done"];

export default function ForgotPassword() {
  const [step,       setStep]       = useState("email");
  const [email,      setEmail]      = useState("");
  const [otp,        setOtp]        = useState(["","","","",""]);
  const [newPass,    setNewPass]    = useState("");
  const [confirmPass,setConfirmPass]= useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const otpRefs   = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const successScale = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0); slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:380, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:380, useNativeDriver:true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, [step]);

  const goNext = (nextStep) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(nextStep); }, 1200);
  };

  const handleOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 4) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
    if (next.every(d => d) && val) goNext("reset");
  };

  const handleReset = () => {
    if (!newPass || newPass !== confirmPass) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("done");
      Animated.spring(successScale, { toValue:1, useNativeDriver:true, friction:4, tension:60 }).start();
    }, 1400);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios"?"padding":undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step==="email" ? router.back() : setStep(STEPS[STEPS.indexOf(step)-1])} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[s.body, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>

          {/* ── Email step ── */}
          {step === "email" && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name="lock-closed-outline" size={32} color="#1E3A8A" />
              </View>
              <Text style={s.title}>Forgot Password?</Text>
              <Text style={s.sub}>Enter your AFIT email and we'll send you a verification code.</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={s.input}
                  placeholder="yourname@afit.edu.ng"
                  placeholderTextColor="#D1D5DB"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={[s.btn, (!email || loading) && s.btnDisabled]}
                onPress={() => goNext("otp")}
                disabled={!email || loading}
              >
                <Text style={s.btnTxt}>{loading ? "Sending…" : "Send Code"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backLink} onPress={() => router.push("/Login")}>
                <Text style={s.backLinkTxt}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── OTP step ── */}
          {step === "otp" && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name="mail-open-outline" size={32} color="#1E3A8A" />
              </View>
              <Text style={s.title}>Check your email</Text>
              <Text style={s.sub}>We sent a 5-digit code to{"\n"}<Text style={{ fontWeight:"700", color:"#111827" }}>{email || "your email"}</Text></Text>
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
              <TouchableOpacity style={s.resendRow} onPress={() => goNext("otp")}>
                <Text style={s.resendTxt}>Didn't get it? </Text>
                <Text style={s.resendLink}>Resend code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={() => goNext("reset")}
                disabled={loading}
              >
                <Text style={s.btnTxt}>{loading ? "Verifying…" : "Verify Code"}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Reset step ── */}
          {step === "reset" && (
            <>
              <View style={s.iconWrap}>
                <Ionicons name="key-outline" size={32} color="#1E3A8A" />
              </View>
              <Text style={s.title}>New Password</Text>
              <Text style={s.sub}>Choose a strong password you haven't used before.</Text>

              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={s.input}
                  placeholder="New password"
                  placeholderTextColor="#D1D5DB"
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={[s.inputWrap, { marginTop:4 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={s.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#D1D5DB"
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry={!showPass}
                />
                {confirmPass.length > 0 && (
                  <Ionicons
                    name={newPass === confirmPass ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={newPass === confirmPass ? "#15803D" : "#EF4444"}
                  />
                )}
              </View>

              {/* Strength */}
              {newPass.length > 0 && (
                <View style={s.strengthRow}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={[s.strengthBar, {
                      backgroundColor: newPass.length >= i*3
                        ? (newPass.length >= 12 ? "#15803D" : newPass.length >= 6 ? "#F97316" : "#EF4444")
                        : "#E5E7EB"
                    }]} />
                  ))}
                  <Text style={s.strengthTxt}>
                    {newPass.length >= 12 ? "Strong" : newPass.length >= 6 ? "Medium" : "Weak"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.btn, { marginTop:16 }, (!newPass || newPass !== confirmPass || loading) && s.btnDisabled]}
                onPress={handleReset}
                disabled={!newPass || newPass !== confirmPass || loading}
              >
                <Text style={s.btnTxt}>{loading ? "Resetting…" : "Reset Password"}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <View style={s.doneWrap}>
              <Animated.View style={[s.doneCircle, { transform:[{scale:successScale}] }]}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </Animated.View>
              <Text style={s.doneTitle}>Password Reset!</Text>
              <Text style={s.doneSub}>Your password has been updated successfully. You can now log in.</Text>
              <TouchableOpacity style={[s.btn, { marginTop:24 }]} onPress={() => router.replace("/Login")}>
                <Text style={s.btnTxt}>Back to Login</Text>
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
  header: { paddingHorizontal:16, paddingVertical:12 },
  body: { flex:1, paddingHorizontal:28, paddingTop:8, paddingBottom:40 },
  iconWrap: { width:68, height:68, borderRadius:24, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", marginBottom:20 },
  title: { fontSize:26, fontWeight:"900", color:"#111827", letterSpacing:-0.5, marginBottom:10 },
  sub: { fontSize:14, color:"#6B7280", lineHeight:22, marginBottom:28 },
  inputWrap: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#F3F4F6", borderRadius:16, paddingHorizontal:14, height:52, marginBottom:12 },
  input: { flex:1, fontSize:15, color:"#111827" },
  btn: { height:54, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  btnDisabled: { backgroundColor:"#93C5FD", shadowOpacity:0 },
  btnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  backLink: { alignItems:"center", marginTop:16 },
  backLinkTxt: { fontSize:14, color:"#9CA3AF", fontWeight:"500" },
  otpRow: { flexDirection:"row", gap:10, justifyContent:"center", marginBottom:20 },
  otpBox: { width:52, height:58, borderRadius:16, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", fontSize:22, fontWeight:"800", color:"#111827", textAlign:"center" },
  otpBoxFilled: { borderColor:"#1E3A8A", backgroundColor:"#EFF6FF" },
  resendRow: { flexDirection:"row", justifyContent:"center", marginBottom:20 },
  resendTxt: { fontSize:13, color:"#9CA3AF" },
  resendLink: { fontSize:13, fontWeight:"700", color:"#1E3A8A" },
  strengthRow: { flexDirection:"row", alignItems:"center", gap:5, marginTop:4 },
  strengthBar: { flex:1, height:4, borderRadius:2 },
  strengthTxt: { fontSize:11, fontWeight:"600", color:"#9CA3AF", marginLeft:4 },
  doneWrap: { flex:1, alignItems:"center", justifyContent:"center", gap:12 },
  doneCircle: { width:88, height:88, borderRadius:44, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center", marginBottom:8, shadowColor:"#15803D", shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:16, elevation:12 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:22 },
});
