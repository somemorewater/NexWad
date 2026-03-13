// app/change-password.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Rule = ({ label, met }) => (
  <View style={r.row}>
    <Ionicons name={met ? "checkmark-circle" : "ellipse-outline"} size={15} color={met ? "#15803D" : "#9CA3AF"} />
    <Text style={[r.txt, met && r.txtMet]}>{label}</Text>
  </View>
);
const r = StyleSheet.create({
  row: { flexDirection:"row", alignItems:"center", gap:8 },
  txt: { fontSize:12, color:"#9CA3AF" },
  txtMet: { color:"#15803D" },
});

export default function ChangePassword() {
  const [current,    setCurrent]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  // Password rules
  const rules = [
    { label:"At least 8 characters",           met: newPass.length >= 8 },
    { label:"Contains a number",                met: /\d/.test(newPass) },
    { label:"Contains uppercase letter",        met: /[A-Z]/.test(newPass) },
    { label:"Passwords match",                  met: newPass.length > 0 && newPass === confirm },
  ];
  const allMet = rules.every(r => r.met) && current.length > 0;

  const handleSave = () => {
    if (!allMet) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.back(), 2000);
    }, 1500);
  };

  if (saved) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:14, transform:[{ scale: doneScale }] }}>
          <View style={s.doneCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={s.doneTitle}>Password Updated!</Text>
          <Text style={s.doneSub}>Your password has been changed successfully.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Password</Text>
        <View style={{ width:24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==="ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom:120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={[s.content, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>

            {/* Icon */}
            <View style={s.iconWrap}>
              <Ionicons name="lock-closed-outline" size={32} color="#1E3A8A" />
            </View>
            <Text style={s.subtitle}>Keep your account secure with a strong password.</Text>

            {/* Current password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Current Password</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showCur}
                  value={current}
                  onChangeText={setCurrent}
                />
                <TouchableOpacity onPress={() => setShowCur(v => !v)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <Ionicons name={showCur ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>New Password</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNew}
                  value={newPass}
                  onChangeText={setNewPass}
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Confirm New Password</Text>
              <View style={[s.inputRow, confirm.length > 0 && newPass !== confirm && s.inputRowErr]}>
                <TextInput
                  style={s.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConf}
                  value={confirm}
                  onChangeText={setConfirm}
                />
                <TouchableOpacity onPress={() => setShowConf(v => !v)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <Ionicons name={showConf ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {confirm.length > 0 && newPass !== confirm && (
                <Text style={s.errTxt}>Passwords do not match</Text>
              )}
            </View>

            {/* Rules */}
            {newPass.length > 0 && (
              <View style={s.rulesBox}>
                {rules.slice(0,3).map(rule => (
                  <Rule key={rule.label} label={rule.label} met={rule.met} />
                ))}
              </View>
            )}

            {/* Forgot current password */}
            <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ alignSelf:"flex-start" }}>
              <Text style={s.forgotTxt}>Forgot your current password?</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA */}
      <View style={s.cta}>
        <TouchableOpacity
          style={[s.ctaBtn, !allMet && s.ctaBtnDisabled]}
          onPress={handleSave}
          disabled={saving || !allMet}
          activeOpacity={allMet ? 0.88 : 1}
        >
          {saving
            ? <Text style={s.ctaTxt}>Updating…</Text>
            : <>
                <Ionicons name="lock-closed-outline" size={16} color={allMet ? "#FCD34D" : "#6B7280"} />
                <Text style={s.ctaTxt}>Update Password</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  content: { padding:20, gap:20 },
  iconWrap: { width:64, height:64, borderRadius:32, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", alignSelf:"center", marginTop:8 },
  subtitle: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:21 },
  field: { gap:8 },
  fieldLabel: { fontSize:12, fontWeight:"700", color:"#374151", textTransform:"uppercase", letterSpacing:0.5 },
  inputRow: { flexDirection:"row", alignItems:"center", borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", paddingHorizontal:14, height:50 },
  inputRowErr: { borderColor:"#FCA5A5" },
  input: { flex:1, fontSize:14, color:"#111827" },
  errTxt: { fontSize:11, color:"#EF4444" },
  rulesBox: { backgroundColor:"#F9FAFB", borderRadius:14, padding:14, gap:10, borderWidth:1, borderColor:"#F3F4F6" },
  forgotTxt: { fontSize:13, color:"#1E3A8A", fontWeight:"600" },
  cta: { position:"absolute", bottom:0, left:0, right:0, padding:16, paddingBottom:Platform.OS==="ios"?28:16, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaBtnDisabled: { backgroundColor:"#E5E7EB", shadowOpacity:0, elevation:0 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  doneCircle: { width:80, height:80, borderRadius:40, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center" },
  doneTitle: { fontSize:22, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center" },
});
