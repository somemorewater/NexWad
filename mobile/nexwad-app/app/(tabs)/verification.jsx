// app/verification.jsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Animated, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const STEPS = [
  { id:"matric",  title:"Matric number verified",       done:true,  icon:"checkmark-circle", color:"#15803D", bg:"#F0FDF4" },
  { id:"email",   title:"AFIT email confirmed",          done:true,  icon:"checkmark-circle", color:"#15803D", bg:"#F0FDF4" },
  { id:"photo",   title:"Student ID photo",              done:true,  icon:"checkmark-circle", color:"#15803D", bg:"#F0FDF4" },
  { id:"phone",   title:"Phone number verification",     done:false, icon:"ellipse-outline",  color:"#9CA3AF", bg:"#F3F4F6" },
  { id:"payment", title:"Payment method on file",        done:false, icon:"ellipse-outline",  color:"#9CA3AF", bg:"#F3F4F6" },
];

export default function Verification() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue:1, duration:420, useNativeDriver:true }).start(); }, []);
  const doneCount = STEPS.filter(s => s.done).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Verification</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.ScrollView style={{ opacity:fadeAnim }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:20, paddingBottom:40 }}>

        {/* Badge */}
        <View style={s.badgeCard}>
          <View style={s.badgeIcon}>
            <Ionicons name="shield-checkmark" size={36} color="#1E3A8A" />
          </View>
          <Text style={s.badgeTitle}>Verified AFIT Student</Text>
          <Text style={s.badgeSub}>{pct}% complete — {doneCount} of {STEPS.length} steps done</Text>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width:`${pct}%` }]} />
          </View>
        </View>

        <Text style={s.sectionLabel}>Verification Steps</Text>
        {STEPS.map((step, i) => (
          <TouchableOpacity
            key={step.id}
            style={[s.stepCard, step.done && s.stepDone]}
            onPress={() => !step.done && router.push(`/verify/${step.id}`)}
            activeOpacity={step.done ? 1 : 0.88}
          >
            <View style={[s.stepIcon, { backgroundColor:step.bg }]}>
              <Ionicons name={step.icon} size={22} color={step.color} />
            </View>
            <Text style={[s.stepTitle, step.done && { color:"#15803D" }]}>{step.title}</Text>
            {step.done
              ? <Ionicons name="checkmark" size={16} color="#15803D" />
              : <Text style={s.stepAction}>Complete →</Text>
            }
          </TouchableOpacity>
        ))}
<TouchableOpacity
          style={{ height:54, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginTop:8, marginBottom:12 }}
          onPress={() => router.replace("/(tabs)/feed")}
        >
          <Text style={{ fontSize:15, fontWeight:"800", color:"#fff" }}>Continue to App →</Text>
        </TouchableOpacity>
        <View style={s.infoNote}></View>
        <View style={s.infoNote}>
          <Ionicons name="information-circle-outline" size={15} color="#3B82F6" />
          <Text style={s.infoTxt}>Full verification unlocks the Verified Seller badge and increases buyer trust.</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  badgeCard: { alignItems:"center", backgroundColor:"#fff", borderRadius:24, padding:24, marginBottom:20, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  badgeIcon: { width:72, height:72, borderRadius:36, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", marginBottom:12 },
  badgeTitle: { fontSize:18, fontWeight:"800", color:"#111827", marginBottom:4 },
  badgeSub: { fontSize:13, color:"#9CA3AF", marginBottom:14 },
  progressTrack: { width:"100%", height:8, backgroundColor:"#E5E7EB", borderRadius:4, overflow:"hidden" },
  progressFill: { height:"100%", backgroundColor:"#1E3A8A", borderRadius:4 },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 },
  stepCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:14, marginBottom:10, borderWidth:1, borderColor:"#F3F4F6" },
  stepDone: { borderColor:"#BBF7D0", backgroundColor:"#F0FDF4" },
  stepIcon: { width:42, height:42, borderRadius:14, alignItems:"center", justifyContent:"center" },
  stepTitle: { flex:1, fontSize:14, fontWeight:"600", color:"#374151" },
  stepAction: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  infoNote: { flexDirection:"row", gap:8, backgroundColor:"#EFF6FF", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BFDBFE", marginTop:8 },
  infoTxt: { flex:1, fontSize:12, color:"#3B82F6", lineHeight:18 },
});
