// app/terms.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, SectionList, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LAST_UPDATED = "March 2026";

const SECTIONS_DATA = [
  {
    key: "intro",
    title: "Introduction",
    icon: "document-text-outline",
    data: [`Welcome to Nexwad ("we", "our", or "us"). These Terms of Service govern your use of the Nexwad platform, including our mobile app, marketplace, feed, and all related services available exclusively to students and staff of the Air Force Institute of Technology (AFIT), Kaduna.\n\nBy creating an account or using Nexwad, you confirm that you are an AFIT student or staff member and that you agree to be bound by these Terms. If you do not agree, please do not use the platform.`],
  },
  {
    key: "eligibility",
    title: "Eligibility",
    icon: "person-circle-outline",
    data: [
      "You must be a currently enrolled AFIT student or verified AFIT staff to register and use Nexwad.",
      "You must be at least 18 years old or have parental/guardian consent.",
      "You may only maintain one active account. Duplicate accounts may be suspended without notice.",
      "You are responsible for keeping your login credentials secure. Nexwad is not liable for any loss resulting from unauthorised access to your account.",
    ],
  },
  {
    key: "conduct",
    title: "User Conduct",
    icon: "shield-checkmark-outline",
    data: [
      "You agree not to post listings for prohibited items including but not limited to: weapons, controlled substances, stolen goods, counterfeit products, or any item illegal under Nigerian law.",
      "You must not harass, threaten, or abuse other users through messages, reviews, or any other feature.",
      "Spam, unsolicited advertising, or automated bots are strictly prohibited.",
      "You may not attempt to circumvent platform payment systems or engage in transactions outside Nexwad to avoid fees.",
      "Any attempt to hack, scrape, or reverse-engineer the platform will result in immediate account termination and may attract legal action.",
    ],
  },
  {
    key: "listings",
    title: "Listings & Marketplace",
    icon: "storefront-outline",
    data: [
      "All listings must accurately describe the item or service being offered. Misleading descriptions are grounds for account suspension.",
      "Sellers are solely responsible for the accuracy, legality, and quality of their listings.",
      "Nexwad reserves the right to remove any listing at its discretion without prior notice.",
      "Buyer and seller disputes should first be resolved between the parties. Nexwad may assist in mediation but is not liable for transaction outcomes.",
      "Sellers on paid plans (Basic, Pro, Elite) must comply with all seller-specific terms outlined during onboarding.",
    ],
  },
  {
    key: "payments",
    title: "Payments & Subscriptions",
    icon: "card-outline",
    data: [
      "Seller subscription fees (Basic: ₦2,000/mo, Pro: ₦3,000/mo, Elite: ₦6,000/mo) and buyer premium fees (₦100/mo) are billed monthly.",
      "All payments are processed securely. Nexwad does not store card details on its servers.",
      "Subscriptions renew automatically until cancelled. You may cancel at any time from your account settings.",
      "Refunds for subscription fees are not provided except in cases of technical error on our part, assessed at our sole discretion.",
      "Nexwad is not responsible for failed or delayed bank transfers initiated outside the platform.",
    ],
  },
  {
    key: "ip",
    title: "Intellectual Property",
    icon: "ribbon-outline",
    data: [
      "All content, branding, design, and code on Nexwad is the intellectual property of Nexwad Technologies and may not be reproduced without written permission.",
      "By posting content (photos, descriptions, reviews) on the platform, you grant Nexwad a non-exclusive, royalty-free licence to display and distribute that content within the app.",
      "You retain ownership of all content you post. You confirm that you have the rights to any content you upload.",
    ],
  },
  {
    key: "termination",
    title: "Termination",
    icon: "close-circle-outline",
    data: [
      "Nexwad reserves the right to suspend or permanently delete any account that violates these Terms, without prior notice.",
      "You may delete your account at any time from Settings > Danger Zone. Deletion is irreversible.",
      "Upon termination, your data will be handled in accordance with our Privacy Policy.",
    ],
  },
  {
    key: "liability",
    title: "Limitation of Liability",
    icon: "alert-circle-outline",
    data: [
      "Nexwad is a platform connecting buyers and sellers. We are not a party to any transaction and accept no liability for the quality, safety, or legality of items listed.",
      "To the maximum extent permitted by law, Nexwad shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
      "We do not guarantee uninterrupted or error-free service. The platform is provided on an 'as is' basis.",
    ],
  },
  {
    key: "changes",
    title: "Changes to These Terms",
    icon: "refresh-outline",
    data: [
      "We may update these Terms from time to time. When we do, we'll notify you via the app and update the 'Last updated' date at the top of this page.",
      "Continued use of Nexwad after changes are posted constitutes your acceptance of the revised Terms.",
    ],
  },
  {
    key: "contact",
    title: "Contact Us",
    icon: "mail-outline",
    data: [`If you have questions about these Terms, please reach out to us:\n\n📧 legal@nexwad.com\n📍 AFIT Campus, Kaduna, Nigeria`],
  },
];

export default function Terms() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [expanded, setExpanded] = useState({ intro: true });

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
          <Text style={s.headerTitle}>Terms of Service</Text>
          <Text style={s.headerSub}>Last updated: {LAST_UPDATED}</Text>
        </View>
      </View>

      {/* Banner */}
      <Animated.View style={[s.banner, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <View style={s.bannerIcon}>
          <Ionicons name="document-text" size={22} color="#1E3A8A" />
        </View>
        <Text style={s.bannerTxt}>
          Please read these terms carefully. They govern your use of Nexwad as an AFIT community member.
        </Text>
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
              {/* Section header */}
              <TouchableOpacity
                style={s.sectionHeader}
                onPress={() => toggle(section.key)}
                activeOpacity={0.8}
              >
                <View style={s.sectionIconWrap}>
                  <Ionicons name={section.icon} size={16} color="#1E3A8A" />
                </View>
                <Text style={s.sectionTitle}>{idx + 1}. {section.title}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Section body */}
              {isOpen && (
                <View style={s.sectionBody}>
                  {section.data.map((item, i) => (
                    <View key={i} style={s.clause}>
                      {section.data.length > 1 && (
                        <View style={s.bullet} />
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
          <TouchableOpacity onPress={() => router.push("/privacy")}>
            <Text style={s.footerLink}>View Privacy Policy →</Text>
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

  banner: { flexDirection:"row", alignItems:"center", gap:12, margin:16, marginBottom:4, backgroundColor:"#EFF6FF", borderRadius:16, padding:14, borderWidth:1, borderColor:"#BFDBFE" },
  bannerIcon: { width:40, height:40, borderRadius:20, backgroundColor:"#DBEAFE", alignItems:"center", justifyContent:"center", flexShrink:0 },
  bannerTxt: { flex:1, fontSize:12, color:"#1D4ED8", lineHeight:18 },

  section: { backgroundColor:"#fff", borderRadius:18, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.03, shadowRadius:4, elevation:1 },
  sectionHeader: { flexDirection:"row", alignItems:"center", gap:10, padding:14 },
  sectionIconWrap: { width:32, height:32, borderRadius:16, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  sectionTitle: { flex:1, fontSize:14, fontWeight:"800", color:"#111827" },

  sectionBody: { paddingHorizontal:14, paddingBottom:14, gap:10, borderTopWidth:1, borderTopColor:"#F9FAFB", paddingTop:10 },
  clause: { flexDirection:"row", gap:10, alignItems:"flex-start" },
  bullet: { width:6, height:6, borderRadius:3, backgroundColor:"#1E3A8A", marginTop:7, flexShrink:0 },
  clauseTxt: { flex:1, fontSize:13, color:"#374151", lineHeight:21 },

  footer: { alignItems:"center", gap:8, paddingTop:8 },
  footerTxt: { fontSize:11, color:"#9CA3AF" },
  footerLink: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
});
