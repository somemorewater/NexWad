// app/settings.jsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Animated, ScrollView, Switch, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "Account",
    items: [
      { icon:"person-outline",           label:"Edit Profile",        route:"/edit-profile",   chevron:true  },
      { icon:"shield-checkmark-outline", label:"Verification",        route:"/verification",   chevron:true  },
      { icon:"card-outline",             label:"Payment Methods",     route:"/payments",       chevron:true  },
      { icon:"lock-closed-outline",      label:"Change Password",     route:"/change-password",chevron:true  },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon:"notifications-outline",    label:"Push Notifications",  toggle:true, key:"notifs"   },
      { icon:"mail-outline",             label:"Email Alerts",        toggle:true, key:"email"    },
      { icon:"bicycle-outline",          label:"Delivery Updates",    toggle:true, key:"delivery" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon:"help-circle-outline",      label:"Help & Support",      route:"/support",        chevron:true },
      { icon:"document-text-outline",    label:"Terms of Service",    route:"/terms",          chevron:true },
      { icon:"eye-outline",              label:"Privacy Policy",      route:"/privacy",        chevron:true },
      { icon:"star-outline",             label:"Rate Nexwad",         route:"/rate",           chevron:true },
    ],
  },
  {
    title: "Admin",
    admin: true,
    items: [
      { icon:"shield-half-outline",      label:"Admin Dashboard",     route:"/admin",          chevron:true },
    ],
  },
  {
    title: "Danger Zone",
    items: [
      { icon:"log-out-outline",          label:"Sign Out",            danger:true,  action:"logout"  },
      { icon:"trash-outline",            label:"Delete Account",      danger:true,  action:"delete"  },
    ],
  },
];

export default function Settings() {
  const [toggles, setToggles] = useState({ notifs:true, email:false, delivery:true });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, {toValue:1, duration:400, useNativeDriver:true}).start(); }, []);

  // Mock: in production derive from auth token / user role
  const isAdmin = true;
  const visibleSections = SECTIONS.filter(sec => !sec.admin || isAdmin);

  const handleAction = (item) => {
    if (item.route) { router.push(item.route); return; }
    if (item.action === "logout") { router.replace("/login"); return; }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{width:24}} />
      </View>

      <Animated.ScrollView style={{opacity:fadeAnim}} showsVerticalScrollIndicator={false} contentContainerStyle={{padding:16, paddingBottom:40}}>

        {/* Profile mini-card */}
        <TouchableOpacity style={s.profileCard} onPress={() => router.push("/(tabs)/profile")}>
          <View style={s.profileAvatar}><Text style={s.profileInitials}>AO</Text></View>
          <View style={{flex:1}}>
            <Text style={s.profileName}>Adaeze Okonkwo</Text>
            <Text style={s.profileHandle}>@ada_okonkwo · CSC 300L</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>

        {visibleSections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.row, i < section.items.length - 1 && s.rowBorder]}
                  onPress={() => handleAction(item)}
                  disabled={!!item.toggle}
                  activeOpacity={item.toggle ? 1 : 0.7}
                >
                  <View style={[s.iconWrap, item.danger && {backgroundColor:"#FEF2F2"}]}>
                    <Ionicons name={item.icon} size={18} color={item.danger ? "#EF4444" : "#374151"} />
                  </View>
                  <Text style={[s.rowLabel, item.danger && {color:"#EF4444"}]}>{item.label}</Text>
                  {item.toggle && (
                    <Switch
                      value={toggles[item.key]}
                      onValueChange={v => setToggles(prev => ({...prev, [item.key]:v}))}
                      trackColor={{false:"#E5E7EB", true:"#1E3A8A"}}
                      thumbColor="#fff"
                      ios_backgroundColor="#E5E7EB"
                    />
                  )}
                  {item.chevron && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={s.version}>Nexwad v1.0.0 · Made for AFIT</Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  profileCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:20, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  profileAvatar: { width:50, height:50, borderRadius:25, backgroundColor:"#DCFCE7", alignItems:"center", justifyContent:"center" },
  profileInitials: { fontSize:16, fontWeight:"800", color:"#15803D" },
  profileName: { fontSize:15, fontWeight:"700", color:"#111827" },
  profileHandle: { fontSize:12, color:"#9CA3AF", marginTop:1 },
  section: { marginBottom:16 },
  sectionTitle: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8, marginLeft:4 },
  sectionCard: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6" },
  row: { flexDirection:"row", alignItems:"center", gap:13, paddingHorizontal:16, paddingVertical:14 },
  rowBorder: { borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  iconWrap: { width:34, height:34, borderRadius:10, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  rowLabel: { flex:1, fontSize:14, fontWeight:"500", color:"#111827" },
  version: { textAlign:"center", fontSize:12, color:"#D1D5DB", marginTop:12 },
});
