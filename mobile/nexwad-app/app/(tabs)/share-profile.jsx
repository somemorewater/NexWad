// app/share-profile.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, Platform, Clipboard,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PROFILE_URL = "https://nexwad.app/u/ada_okonkwo";

const SHARE_OPTIONS = [
  { id:"whatsapp", icon:"logo-whatsapp",   label:"WhatsApp",  color:"#25D366", bg:"#F0FFF4" },
  { id:"copy",     icon:"link-outline",    label:"Copy Link", color:"#1E3A8A", bg:"#EFF6FF" },
  { id:"qr",       icon:"qr-code-outline", label:"QR Code",   color:"#374151", bg:"#F3F4F6" },
  { id:"email",    icon:"mail-outline",    label:"Email",     color:"#EA580C", bg:"#FFF7ED" },
  { id:"twitter",  icon:"logo-twitter",    label:"Twitter",   color:"#1DA1F2", bg:"#EFF9FF" },
  { id:"more",     icon:"share-outline",   label:"More",      color:"#6B7280", bg:"#F9FAFB" },
];

export default function ShareProfile() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [copied,  setCopied]  = useState(false);
  const [toast,   setToast]   = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue:1, duration:200, useNativeDriver:true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue:0, duration:200, useNativeDriver:true }),
    ]).start(() => setToast(""));
  };

  const handleShareOption = (opt) => {
    if (opt.id === "copy") {
      Clipboard.setString(PROFILE_URL);
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } else if (opt.id === "qr") {
      showToast("QR Code — coming soon");
    } else if (opt.id === "whatsapp" || opt.id === "twitter" || opt.id === "email" || opt.id === "more") {
      showToast(`Opening ${opt.label}…`);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Share Profile</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim, transform:[{translateY:slideAnim}], padding:24 }}>

        {/* Profile preview card */}
        <View style={s.previewCard}>
          {/* QR placeholder */}
          <View style={s.qrBox}>
            <View style={s.qrInner}>
              {/* decorative QR dots */}
              {Array.from({length:16}).map((_,i) => (
                <View key={i} style={[s.qrDot, (i%5===0||i%7===0)&&{backgroundColor:"#1E3A8A"}]} />
              ))}
            </View>
          </View>
          <View style={s.previewAvatar}>
            <Text style={s.previewInitials}>AO</Text>
          </View>
          <Text style={s.previewName}>Adaeze Okonkwo</Text>
          <Text style={s.previewHandle}>@ada_okonkwo</Text>
          <View style={s.previewPill}>
            <Ionicons name="shield-checkmark" size={11} color="#1E3A8A" />
            <Text style={s.previewPillTxt}>Verified AFIT Student</Text>
          </View>
          <Text style={s.previewLink}>nexwad.app/u/ada_okonkwo</Text>
        </View>

        {/* Share options */}
        <Text style={s.shareLabel}>Share via</Text>
        <View style={s.shareGrid}>
          {SHARE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.label} style={s.shareBtn} onPress={() => handleShareOption(opt)}>
              <View style={[s.shareBtnIcon, { backgroundColor: opt.id === "copy" && copied ? "#DCFCE7" : opt.bg }]}>
                <Ionicons name={opt.id === "copy" && copied ? "checkmark" : opt.icon} size={22} color={opt.id === "copy" && copied ? "#15803D" : opt.color} />
              </View>
              <Text style={s.shareBtnTxt}>{opt.id === "copy" && copied ? "Copied!" : opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Link bar */}
        <View style={s.linkBar}>
          <Text style={s.linkTxt} numberOfLines={1}>nexwad.app/u/ada_okonkwo</Text>
          <TouchableOpacity style={s.copyBtn}>
            <Ionicons name="copy-outline" size={16} color="#1E3A8A" />
            <Text style={s.copyTxt}>Copy</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Toast */}
      {toast.length > 0 && (
        <Animated.View style={[s.toast, { opacity: toastAnim }]}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={s.toastTxt}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  previewCard: { backgroundColor:"#F9FAFB", borderRadius:24, padding:24, alignItems:"center", borderWidth:1, borderColor:"#E5E7EB", marginBottom:28 },
  qrBox: { width:100, height:100, backgroundColor:"#fff", borderRadius:16, alignItems:"center", justifyContent:"center", marginBottom:16, padding:10, borderWidth:1, borderColor:"#E5E7EB" },
  qrInner: { flexDirection:"row", flexWrap:"wrap", width:80, height:80, gap:3 },
  qrDot: { width:14, height:14, borderRadius:3, backgroundColor:"#E5E7EB" },
  previewAvatar: { width:60, height:60, borderRadius:30, backgroundColor:"#DCFCE7", alignItems:"center", justifyContent:"center", marginBottom:8 },
  previewInitials: { fontSize:18, fontWeight:"900", color:"#15803D" },
  previewName: { fontSize:17, fontWeight:"800", color:"#111827", marginBottom:3 },
  previewHandle: { fontSize:13, color:"#9CA3AF", marginBottom:8 },
  previewPill: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#EFF6FF", paddingHorizontal:10, paddingVertical:4, borderRadius:12, marginBottom:8 },
  previewPillTxt: { fontSize:11, fontWeight:"700", color:"#1E3A8A" },
  previewLink: { fontSize:12, color:"#9CA3AF", fontStyle:"italic" },
  shareLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:14 },
  shareGrid: { flexDirection:"row", flexWrap:"wrap", gap:12, marginBottom:20 },
  shareBtn: { width:"30%", alignItems:"center", gap:6 },
  shareBtnIcon: { width:52, height:52, borderRadius:16, alignItems:"center", justifyContent:"center" },
  shareBtnTxt: { fontSize:11, fontWeight:"600", color:"#374151" },
  linkBar: { flexDirection:"row", alignItems:"center", backgroundColor:"#F3F4F6", borderRadius:16, paddingHorizontal:14, paddingVertical:12, gap:10 },
  linkTxt: { flex:1, fontSize:13, color:"#374151" },
  copyBtn: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#EFF6FF", paddingHorizontal:12, paddingVertical:7, borderRadius:12 },
  copyTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  toast: { position:"absolute", bottom:40, alignSelf:"center", flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#111827", paddingHorizontal:18, paddingVertical:12, borderRadius:20 },
  toastTxt: { fontSize:13, fontWeight:"600", color:"#fff" },
});
