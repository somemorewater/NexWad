// app/lost-found/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LF_ITEMS = {
  lf1: {
    id:"lf1", type:"lost",
    title:"Black HP Laptop Bag",
    description:"Lost near the library on Tuesday afternoon around 2–4pm. The bag is matte black with an HP logo on the front pocket. It has a distinctive red keyring tag on the main zip.\n\nContents at time of loss:\n• HP laptop (15 inch)\n• Power adapter\n• Engineering Drawing notes\n• Student ID\n\nIf you found this bag or have any information, please DM me immediately. I really need my notes back.",
    location:"Main Library / Block A corridor",
    date:"Today, ~2pm",
    cat:"accessories",
    reward:"₦2,000 reward",
    hasReward:true,
    resolved:false,
    icon:"bag-handle-outline",
    iconBg:"#1E3A8A",
    poster:{ name:"Tunde Adeleke", initials:"TA", bg:"#DBEAFE", color:"#1E3A8A", dept:"CSC 400L", handle:"tunde.a" },
    responses:3,
    views:47,
  },
  lf2: {
    id:"lf2", type:"found",
    title:"Student ID Card — Amaka Obi",
    description:"Found this student ID card on the floor outside the EEE lecture hall (Room 101) on Wednesday morning around 9am.\n\nThe card belongs to a student named Amaka Obi. It appears to be an AFIT student ID with a 2022 admission year printed on it.\n\nTo claim: please DM me and describe any other details on the card (matric number, programme) to confirm identity.",
    location:"EEE Block, Room 101 corridor",
    date:"Today, ~9am",
    cat:"documents",
    reward:null,
    hasReward:false,
    resolved:false,
    icon:"card-outline",
    iconBg:"#854D0E",
    poster:{ name:"Emeka Balogun", initials:"EB", bg:"#FEF9C3", color:"#854D0E", dept:"EEE 400L", handle:"emeka.b" },
    responses:1,
    views:31,
  },
  lf3: {
    id:"lf3", type:"lost",
    title:"Casio fx-991EX Calculator",
    description:"Left my calculator in the Maths lecture room (Block D, Room 204) after the CAC continuous assessment test on Monday.\n\nThe calculator has my name written in black marker inside the battery cover: 'N. Alli'.\n\nIt has a silver body and comes in a navy blue Casio case. The case also has a small sticker on the back.\n\nPlease DM if found.",
    location:"Block D, Room 204",
    date:"Yesterday",
    cat:"electronics",
    reward:"₦500 reward",
    hasReward:true,
    resolved:false,
    icon:"calculator-outline",
    iconBg:"#0369A1",
    poster:{ name:"Ngozi Alli", initials:"NA", bg:"#F0F9FF", color:"#0369A1", dept:"CVE 200L", handle:"ngozi.a" },
    responses:0,
    views:18,
  },
  lf4: {
    id:"lf4", type:"found",
    title:"Set of Keys (3 keys + Benz keyring)",
    description:"Found a set of keys near the female hostel entrance gate yesterday evening around 7pm.\n\nThe keyring has a small Mercedes-Benz logo on it. There are 3 keys on the ring — looks like a room key, a padlock key, and one other key.\n\nTo claim: DM me with a description of the keys or the keyring to verify ownership.",
    location:"Female Hostel Gate",
    date:"Yesterday, ~7pm",
    cat:"keys",
    reward:null,
    hasReward:false,
    resolved:false,
    icon:"key-outline",
    iconBg:"#9D174D",
    poster:{ name:"Fatima Yusuf", initials:"FY", bg:"#FCE7F3", color:"#9D174D", dept:"MEC 200L", handle:"fatimay" },
    responses:2,
    views:55,
  },
  lf5: {
    id:"lf5", type:"lost",
    title:"Navy Blue Hoodie (AFIT branded)",
    description:"Left my hoodie at the sports complex changing area after evening football training on Tuesday.\n\nThe hoodie is navy blue with the AFIT logo on the chest. It also has my name tag sewn into the inside collar: 'C. Eze'.\n\nSize is XL. No reward but I'll be really grateful if it's returned.",
    location:"Sports Complex, Changing Room",
    date:"2 days ago",
    cat:"clothing",
    reward:null,
    hasReward:false,
    resolved:false,
    icon:"shirt-outline",
    iconBg:"#4C1D95",
    poster:{ name:"Chukwudi Eze", initials:"CE", bg:"#EDE9FE", color:"#4C1D95", dept:"CVE 300L", handle:"chuks.e" },
    responses:0,
    views:12,
  },
  lf6: {
    id:"lf6", type:"found",
    title:"Stroud Engineering Maths Textbook",
    description:"Found on a bench near the cafeteria on Monday afternoon. The book has handwritten notes on most pages and some highlighted sections.\n\nThis item has been claimed by the owner and the case is resolved.",
    location:"Cafeteria, Bench Area",
    date:"3 days ago",
    cat:"books",
    reward:null,
    hasReward:false,
    resolved:true,
    icon:"book-outline",
    iconBg:"#15803D",
    poster:{ name:"Ada Okonkwo", initials:"AO", bg:"#DCFCE7", color:"#15803D", dept:"CSC 300L", handle:"ada_sells" },
    responses:4,
    views:88,
  },
};

const DEFAULT = LF_ITEMS.lf1;

const SIMILAR = [
  { id:"lf1", type:"lost",  title:"Black HP Laptop Bag",     icon:"bag-handle-outline",  iconBg:"#1E3A8A", location:"Main Library"    },
  { id:"lf3", type:"lost",  title:"Casio fx-991EX Calc",     icon:"calculator-outline",  iconBg:"#0369A1", location:"Block D, Rm 204" },
  { id:"lf4", type:"found", title:"Keys + Benz Keyring",     icon:"key-outline",         iconBg:"#9D174D", location:"Female Hostel"   },
];

export default function LostFoundDetail() {
  const { id } = useLocalSearchParams();
  const item = LF_ITEMS[id] || DEFAULT;

  const [responded, setResponded] = useState(false);
  const [saved,     setSaved]     = useState(false);
  const isLost = item.type === "lost";

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:460, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:460, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleRespond = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue:0.95, useNativeDriver:true, speed:60 }),
      Animated.spring(btnScale, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    setResponded(true);
    router.push("/messages");
  };

  const accentColor = isLost ? "#EF4444" : "#22C55E";
  const accentBg    = isLost ? "#FEF2F2" : "#F0FDF4";
  const accentBorder= isLost ? "#FECACA" : "#BBF7D0";

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Lost & Found</Text>
        <TouchableOpacity onPress={() => setSaved(v => !v)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color={saved ? "#1E3A8A" : "#111827"} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Hero */}
          <View style={[s.hero, { backgroundColor:item.iconBg + "18" }]}>
            <View style={[s.heroIconCircle, { backgroundColor:item.iconBg + "22" }]}>
              <Ionicons name={item.icon} size={56} color={item.iconBg} style={{ opacity:0.7 }} />
            </View>
            {/* Type badge */}
            <View style={[s.typeBadge, { backgroundColor:accentBg, borderColor:accentBorder }]}>
              <Ionicons
                name={isLost ? "alert-circle-outline" : "checkmark-circle-outline"}
                size={14}
                color={accentColor}
              />
              <Text style={[s.typeBadgeTxt, { color:accentColor }]}>
                {isLost ? "Lost Item" : "Found Item"}
              </Text>
            </View>
            {item.resolved && (
              <View style={s.resolvedOverlay}>
                <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                <Text style={s.resolvedOverlayTxt}>Resolved</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={s.body}>
            {/* Title & meta */}
            <Text style={s.title}>{item.title}</Text>

            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                <Text style={s.metaTxt}>{item.location}</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                <Text style={s.metaTxt}>{item.date}</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="eye-outline" size={13} color="#9CA3AF" />
                <Text style={s.metaTxt}>{item.views} views</Text>
              </View>
            </View>

            {/* Reward badge */}
            {item.hasReward && (
              <View style={s.rewardBanner}>
                <Ionicons name="gift-outline" size={18} color="#B45309" />
                <View>
                  <Text style={s.rewardTitle}>Reward Offered</Text>
                  <Text style={s.rewardAmt}>{item.reward}</Text>
                </View>
              </View>
            )}

            <View style={s.divider} />

            {/* Description */}
            <Text style={s.sectionLabel}>Full Description</Text>
            <Text style={s.description}>{item.description}</Text>

            <View style={s.divider} />

            {/* Posted by */}
            <Text style={s.sectionLabel}>Posted By</Text>
            <TouchableOpacity
              style={s.posterCard}
              onPress={() => router.push(`/seller/${item.poster.handle}`)}
            >
              <View style={[s.posterAvatar, { backgroundColor:item.poster.bg }]}>
                <Text style={[s.posterInitials, { color:item.poster.color }]}>{item.poster.initials}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.posterName}>{item.poster.name}</Text>
                <Text style={s.posterDept}>{item.poster.dept}</Text>
              </View>
              <View style={s.responseCount}>
                <Ionicons name="chatbubble-outline" size={13} color="#9CA3AF" />
                <Text style={s.responseCountTxt}>{item.responses} response{item.responses !== 1 ? "s" : ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={s.divider} />

            {/* Safety tip */}
            <View style={s.safetyCard}>
              <Ionicons name="shield-checkmark-outline" size={17} color="#1E3A8A" />
              <Text style={s.safetyTxt}>
                Always meet in a public campus location to hand over found items. Never share sensitive personal information.
              </Text>
            </View>

            {/* Similar items */}
            <View style={s.divider} />
            <Text style={s.sectionLabel}>Other Active Reports</Text>
            <View style={{ gap:10 }}>
              {SIMILAR.filter(i => i.id !== item.id).map(sim => (
                <TouchableOpacity
                  key={sim.id}
                  style={s.simRow}
                  onPress={() => router.push(`/lost-found/${sim.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[s.simIcon, { backgroundColor:sim.iconBg + "18" }]}>
                    <Ionicons name={sim.icon} size={20} color={sim.iconBg} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.simTitle} numberOfLines={1}>{sim.title}</Text>
                    <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                      <View style={[s.simTypePill, {
                        backgroundColor: sim.type==="lost" ? "#FEF2F2" : "#F0FDF4",
                      }]}>
                        <Text style={[s.simTypeTxt, { color: sim.type==="lost" ? "#EF4444" : "#22C55E" }]}>
                          {sim.type === "lost" ? "Lost" : "Found"}
                        </Text>
                      </View>
                      <Text style={s.simLocation}>{sim.location}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      {!item.resolved && (
        <View style={s.cta}>
          <Animated.View style={{ flex:1, transform:[{scale:btnScale}] }}>
            <TouchableOpacity
              style={[s.respondBtn, { backgroundColor: responded ? "#F3F4F6" : accentColor }]}
              onPress={handleRespond}
              activeOpacity={1}
            >
              <Ionicons
                name={responded ? "checkmark-circle-outline" : isLost ? "hand-right-outline" : "person-outline"}
                size={18}
                color={responded ? "#9CA3AF" : "#fff"}
              />
              <Text style={[s.respondBtnTxt, responded && { color:"#9CA3AF" }]}>
                {responded ? "Message Sent" : isLost ? "I Found This Item" : "This Is Mine"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={s.markResolvedBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },

  hero: { height:200, alignItems:"center", justifyContent:"center", position:"relative" },
  heroIconCircle: { width:110, height:110, borderRadius:55, alignItems:"center", justifyContent:"center" },
  typeBadge: { position:"absolute", bottom:16, flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1 },
  typeBadgeTxt: { fontSize:13, fontWeight:"700" },
  resolvedOverlay: { position:"absolute", top:14, right:14, flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#6B7280", paddingHorizontal:10, paddingVertical:5, borderRadius:14 },
  resolvedOverlayTxt: { fontSize:11, fontWeight:"700", color:"#fff" },

  body: { padding:20 },
  title: { fontSize:22, fontWeight:"900", color:"#111827", letterSpacing:-0.4, lineHeight:28, marginBottom:12 },

  metaRow: { flexDirection:"row", flexWrap:"wrap", gap:12, marginBottom:14 },
  metaItem: { flexDirection:"row", alignItems:"center", gap:4 },
  metaTxt: { fontSize:12, color:"#9CA3AF" },

  rewardBanner: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#FEF9C3", borderRadius:16, padding:14, borderWidth:1, borderColor:"#FDE68A", marginBottom:4 },
  rewardTitle: { fontSize:12, fontWeight:"700", color:"#B45309" },
  rewardAmt: { fontSize:16, fontWeight:"900", color:"#B45309" },

  divider: { height:1, backgroundColor:"#F3F4F6", marginVertical:18 },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 },
  description: { fontSize:14, color:"#374151", lineHeight:23 },

  posterCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#F9FAFB", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  posterAvatar: { width:46, height:46, borderRadius:23, alignItems:"center", justifyContent:"center" },
  posterInitials: { fontSize:14, fontWeight:"800" },
  posterName: { fontSize:14, fontWeight:"700", color:"#111827" },
  posterDept: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  responseCount: { flexDirection:"row", alignItems:"center", gap:4 },
  responseCountTxt: { fontSize:11, color:"#9CA3AF" },

  safetyCard: { flexDirection:"row", gap:10, backgroundColor:"#EFF6FF", borderRadius:14, padding:13, borderWidth:1, borderColor:"#BFDBFE" },
  safetyTxt: { flex:1, fontSize:12, color:"#3B82F6", lineHeight:18 },

  simRow: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#F9FAFB", borderRadius:16, padding:12, borderWidth:1, borderColor:"#F3F4F6" },
  simIcon: { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center" },
  simTitle: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:4 },
  simTypePill: { paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  simTypeTxt: { fontSize:10, fontWeight:"700" },
  simLocation: { fontSize:11, color:"#9CA3AF" },

  cta: { position:"absolute", bottom:0, left:0, right:0, flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:-3}, shadowOpacity:0.06, shadowRadius:10, elevation:10 },
  respondBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, shadowOffset:{width:0,height:6}, shadowOpacity:0.22, shadowRadius:14, elevation:8 },
  respondBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  markResolvedBtn: { width:54, height:54, borderRadius:18, borderWidth:1.5, borderColor:"#E5E7EB", alignItems:"center", justifyContent:"center" },
});
