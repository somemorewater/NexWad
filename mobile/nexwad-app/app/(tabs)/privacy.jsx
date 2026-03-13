// app/privacy.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LAST_UPDATED = "March 2026";

const SECTIONS_DATA = [
  {
    key: "overview",
    title: "Overview",
    icon: "eye-outline",
    color: "#0369A1",
    colorLight: "#EFF6FF",
    data: [`Nexwad ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, how we use it, and what rights you have over it.\n\nThis policy applies to all users of the Nexwad mobile app — buyers, sellers, and guests — operating within the AFIT community.`],
  },
  {
    key: "collect",
    title: "What We Collect",
    icon: "server-outline",
    color: "#1E3A8A",
    colorLight: "#EFF6FF",
    data: [
      "Account data: your name, AFIT student/staff ID, email address, department, and level.",
      "Profile data: profile photo, bio, and any other information you choose to add.",
      "Listing data: photos, descriptions, prices, and categories of items or services you post.",
      "Transaction data: purchase history, payment method type (not card numbers), and subscription plan.",
      "Communication data: messages sent between users within the platform.",
      "Usage data: pages visited, features used, time spent, and device/OS information for analytics.",
      "Location data: approximate campus location if you enable delivery or pickup features (optional).",
    ],
  },
  {
    key: "use",
    title: "How We Use Your Data",
    icon: "construct-outline",
    color: "#7C3AED",
    colorLight: "#F5F3FF",
    data: [
      "To create and manage your account and verify your AFIT identity.",
      "To display your listings and connect you with buyers or sellers.",
      "To process subscription payments and send billing confirmations.",
      "To send you notifications about orders, messages, and platform updates.",
      "To personalise your feed, recommendations, and marketplace results.",
      "To detect and prevent fraud, abuse, and violations of our Terms of Service.",
      "To improve the platform through anonymised analytics and usage patterns.",
    ],
  },
  {
    key: "sharing",
    title: "Who We Share Data With",
    icon: "share-social-outline",
    color: "#0369A1",
    colorLight: "#F0F9FF",
    data: [
      "Other users: your public profile, listings, and reviews are visible to other Nexwad users.",
      "Payment processors: we share minimal necessary data with payment providers to process transactions. We do not store card numbers.",
      "AFIT administration: we may share data with AFIT authorities if legally required or in response to a verified misconduct report.",
      "We do not sell, rent, or trade your personal data to third parties for advertising purposes.",
      "We may share anonymised, aggregated data (e.g. 'most popular categories') with partners without identifying individual users.",
    ],
  },
  {
    key: "retention",
    title: "Data Retention",
    icon: "time-outline",
    color: "#B45309",
    colorLight: "#FFFBEB",
    data: [
      "We retain your data for as long as your account is active or as needed to provide services.",
      "If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.",
      "Transaction records may be retained for up to 7 years for accounting and legal compliance.",
      "Messages between users are retained for 12 months after the conversation ends, then deleted.",
    ],
  },
  {
    key: "security",
    title: "Security",
    icon: "lock-closed-outline",
    color: "#15803D",
    colorLight: "#F0FDF4",
    data: [
      "We use industry-standard encryption (TLS) for all data in transit.",
      "Passwords are hashed and never stored in plain text.",
      "Access to user data within our systems is restricted to authorised personnel only.",
      "While we take security seriously, no system is 100% secure. We encourage you to use a strong, unique password and to report any suspicious activity immediately.",
    ],
  },
  {
    key: "rights",
    title: "Your Rights",
    icon: "hand-right-outline",
    color: "#1E3A8A",
    colorLight: "#EFF6FF",
    data: [
      "Access: you can request a copy of the personal data we hold about you.",
      "Correction: you can update incorrect data from your profile or by contacting us.",
      "Deletion: you can delete your account at any time from Settings > Danger Zone.",
      "Portability: you can request your data in a machine-readable format.",
      "Objection: you can opt out of non-essential data uses such as personalised recommendations.",
      "To exercise any of these rights, contact us at privacy@nexwad.com.",
    ],
  },
  {
    key: "cookies",
    title: "Cookies & Tracking",
    icon: "analytics-outline",
    color: "#9D174D",
    colorLight: "#FDF2F8",
    data: [
      "Our mobile app uses lightweight local storage (not traditional browser cookies) to remember your preferences and session.",
      "We use anonymised analytics tools to understand how the app is used. No personally identifiable data is passed to analytics providers.",
      "We do not use third-party advertising trackers.",
    ],
  },
  {
    key: "children",
    title: "Children's Privacy",
    icon: "people-outline",
    color: "#EF4444",
    colorLight: "#FEF2F2",
    data: [`Nexwad is intended for AFIT students and staff who are 18 years of age or older. We do not knowingly collect personal data from anyone under 18. If you believe a minor has registered on the platform, please contact us immediately at privacy@nexwad.com.`],
  },
  {
    key: "changes",
    title: "Changes to This Policy",
    icon: "refresh-outline",
    color: "#6B7280",
    colorLight: "#F9FAFB",
    data: [
      "We may update this Privacy Policy periodically. When we do, we'll notify you in-app and update the 'Last updated' date.",
      "Your continued use of Nexwad after changes are posted means you accept the updated policy.",
    ],
  },
  {
    key: "contact",
    title: "Contact Us",
    icon: "mail-outline",
    color: "#0369A1",
    colorLight: "#F0F9FF",
    data: [`For any privacy-related questions or requests:\n\n📧 privacy@nexwad.com\n📍 AFIT Campus, Kaduna, Nigeria\n\nWe aim to respond to all requests within 5 business days.`],
  },
];

export default function Privacy() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [expanded, setExpanded] = useState({ overview: true });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <Text style={s.headerSub}>Last updated: {LAST_UPDATED}</Text>
        </View>
      </View>

      {/* Banner */}
      <Animated.View style={[s.banner, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <View style={s.bannerIcon}>
          <Ionicons name="shield-checkmark" size={22} color="#15803D" />
        </View>
        <Text style={s.bannerTxt}>
          Your privacy matters. We only collect what we need and never sell your data to third parties.
        </Text>
      </Animated.View>

      {/* Quick highlights */}
      <Animated.View style={[s.highlights, { opacity:fadeAnim }]}>
        {[
          { icon:"lock-closed",    label:"Encrypted",       color:"#15803D" },
          { icon:"eye-off",        label:"Never sold",      color:"#1E3A8A" },
          { icon:"person",         label:"You're in control",color:"#7C3AED" },
        ].map(h => (
          <View key={h.label} style={s.highlight}>
            <Ionicons name={h.icon} size={18} color={h.color} />
            <Text style={[s.highlightTxt, { color:h.color }]}>{h.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Sections */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity:fadeAnim }}
        contentContainerStyle={{ padding:16, paddingBottom:48, gap:10 }}
      >
        {SECTIONS_DATA.map((section, idx) => {
          const isOpen = !!expanded[section.key];
          return (
            <View key={section.key} style={s.section}>
              <TouchableOpacity
                style={s.sectionHeader}
                onPress={() => toggle(section.key)}
                activeOpacity={0.8}
              >
                <View style={[s.sectionIconWrap, { backgroundColor: section.colorLight }]}>
                  <Ionicons name={section.icon} size={16} color={section.color} />
                </View>
                <Text style={s.sectionTitle}>{idx + 1}. {section.title}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {isOpen && (
                <View style={[s.sectionBody, { borderTopColor: section.colorLight }]}>
                  {section.data.map((item, i) => (
                    <View key={i} style={s.clause}>
                      {section.data.length > 1 && (
                        <View style={[s.bullet, { backgroundColor: section.color }]} />
                      )}
                      <Text style={s.clauseTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>© 2026 Nexwad Technologies · AFIT, Kaduna</Text>
          <TouchableOpacity onPress={() => router.push("/terms")}>
            <Text style={s.footerLink}>View Terms of Service →</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", gap:12, paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  headerSub: { fontSize:11, color:"#93C5FD", marginTop:1 },

  banner: { flexDirection:"row", alignItems:"center", gap:12, margin:16, marginBottom:6, backgroundColor:"#F0FDF4", borderRadius:16, padding:14, borderWidth:1, borderColor:"#BBF7D0" },
  bannerIcon: { width:40, height:40, borderRadius:20, backgroundColor:"#DCFCE7", alignItems:"center", justifyContent:"center", flexShrink:0 },
  bannerTxt: { flex:1, fontSize:12, color:"#15803D", lineHeight:18 },

  highlights: { flexDirection:"row", justifyContent:"space-around", marginHorizontal:16, marginBottom:8, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  highlight: { alignItems:"center", gap:6 },
  highlightTxt: { fontSize:10, fontWeight:"800" },

  section: { backgroundColor:"#fff", borderRadius:18, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.03, shadowRadius:4, elevation:1 },
  sectionHeader: { flexDirection:"row", alignItems:"center", gap:10, padding:14 },
  sectionIconWrap: { width:32, height:32, borderRadius:16, alignItems:"center", justifyContent:"center" },
  sectionTitle: { flex:1, fontSize:14, fontWeight:"800", color:"#111827" },

  sectionBody: { paddingHorizontal:14, paddingBottom:14, gap:10, borderTopWidth:1, paddingTop:10 },
  clause: { flexDirection:"row", gap:10, alignItems:"flex-start" },
  bullet: { width:6, height:6, borderRadius:3, marginTop:7, flexShrink:0 },
  clauseTxt: { flex:1, fontSize:13, color:"#374151", lineHeight:21 },

  footer: { alignItems:"center", gap:8, paddingTop:8 },
  footerTxt: { fontSize:11, color:"#9CA3AF" },
  footerLink: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
});
