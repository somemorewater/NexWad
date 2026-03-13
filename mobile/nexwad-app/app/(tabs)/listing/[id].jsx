// app/listing/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LISTINGS = {
  "1": {
    id:"1", title:"Stroud Engineering Maths 7th Ed", price:4500, priceStr:"₦4,500",
    tag:"Textbooks", tagBg:"#DBEAFE", tagColor:"#1E3A8A",
    imgBg:"#DBEAFE", imgIcon:"book-outline", imgColor:"#1E3A8A",
    description:"Barely used Engineering Mathematics textbook (Stroud 7th edition). All pages intact, no annotations. Great condition — bought at start of semester but switched courses. Ideal for 200L & 300L students.\n\n• Edition: 7th\n• Condition: Very Good\n• Pickup: Block A, CSC Dept",
    seller:{ name:"Adaeze Okonkwo", handle:"ada_sells", initials:"AO", bg:"#DCFCE7", color:"#15803D", dept:"CSC 300L", rating:4.9, reviews:28, sales:38 },
    likes:14, comments:3, time:"2m ago", views:43,
  },
  "2": {
    id:"2", title:"HP 65W USB-C Laptop Charger", price:6000, priceStr:"₦6,000",
    tag:"Electronics", tagBg:"#FEF9C3", tagColor:"#854D0E",
    imgBg:"#FEF9C3", imgIcon:"flash-outline", imgColor:"#854D0E",
    description:"Original HP 65W USB-C charger. Works with HP Pavilion, Envy, and Spectre models. DM me your laptop model to confirm compatibility.\n\n• Output: 65W, 20V\n• Connector: USB-C\n• Condition: Good (minor cable wear)\n• Pickup: EEE block or hostel",
    seller:{ name:"Emeka Balogun", handle:"emeka.b", initials:"EB", bg:"#FEF9C3", color:"#854D0E", dept:"EEE 400L", rating:4.8, reviews:7, sales:52 },
    likes:32, comments:7, time:"18m ago", views:89,
  },
  "3": {
    id:"3", title:"Jollof Rice + Protein (Daily)", price:800, priceStr:"₦800/plate",
    tag:"Food", tagBg:"#FCE7F3", tagColor:"#9D174D",
    imgBg:"#FEF3C7", imgIcon:"restaurant-outline", imgColor:"#B45309",
    description:"Home-cooked jollof rice with your choice of chicken, beef or fish. Cooked fresh daily — no day-old food.\n\n• Available: Mon–Sat, 12pm–3pm\n• Pickup: Block C, female hostel corridor\n• Min order: 1 plate\n• Bulk orders: DM for discount",
    seller:{ name:"Fatima Yusuf", handle:"fatimay", initials:"FY", bg:"#FCE7F3", color:"#9D174D", dept:"MEC 200L", rating:5.0, reviews:34, sales:91 },
    likes:88, comments:21, time:"45m ago", views:203,
  },
  "4": {
    id:"4", title:"AutoCAD & SolidWorks Tutoring", price:3000, priceStr:"₦3,000/session",
    tag:"Services", tagBg:"#EDE9FE", tagColor:"#4C1D95",
    imgBg:"#EDE9FE", imgIcon:"desktop-outline", imgColor:"#4C1D95",
    description:"One-on-one AutoCAD and SolidWorks tutoring sessions. Weekends only, 2hrs per session. Perfect for CVE and MEC students.\n\n• Duration: 2 hours\n• Location: Library or Engineering lab\n• Level: Beginner to intermediate\n• Bring: Laptop with software installed",
    seller:{ name:"Chukwudi Eze", handle:"chuks.e", initials:"CE", bg:"#EDE9FE", color:"#4C1D95", dept:"CVE 300L", rating:4.7, reviews:11, sales:27 },
    likes:11, comments:5, time:"1h ago", views:61,
  },
};

const Stars = ({ rating, size = 12 }) => (
  <View style={{ flexDirection:"row", gap:2 }}>
    {Array.from({ length:5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : i === Math.floor(rating) && rating % 1 >= 0.5 ? "star-half" : "star-outline"}
        size={size}
        color={i < Math.ceil(rating) ? "#F59E0B" : "#D1D5DB"}
      />
    ))}
  </View>
);

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  const listing = LISTINGS[id] || LISTINGS["1"];

  // Mock: in production this would check currentUser.id === listing.sellerId
  const isOwner = false;

  const [liked,      setLiked]      = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [likeCount,  setLikeCount]  = useState(listing.likes);
  const [showReport, setShowReport] = useState(false);
  const [reported,   setReported]   = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:450, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:450, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue:1.45, useNativeDriver:true, speed:60 }),
      Animated.spring(heartScale, { toValue:1,    useNativeDriver:true, speed:40 }),
    ]).start();
    setLiked(v => !v);
    setLikeCount(v => liked ? v - 1 : v + 1);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Listing</Text>
        <View style={{ flexDirection:"row", gap:4 }}>
          <TouchableOpacity onPress={() => setSaved(v => !v)} style={s.hBtn}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color={saved ? "#1E3A8A" : "#111827"} />
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn} onPress={() => setShowReport(v => !v)}>
            <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
          </TouchableOpacity>
          {showReport && (
            <View style={s.reportMenu}>
              <TouchableOpacity style={s.reportMenuItem} onPress={() => { setShowReport(false); /* Native share handled by backend */ }}>
                <Ionicons name="share-social-outline" size={15} color="#374151" />
                <Text style={s.reportMenuTxt}>Share listing</Text>
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity style={s.reportMenuItem} onPress={() => { setShowReport(false); router.push({ pathname:"/pin-listing", params:{ id:listing.id, title:listing.title } }); }}>
                  <Ionicons name="pin-outline" size={15} color="#15803D" />
                  <Text style={[s.reportMenuTxt, { color:"#15803D" }]}>Pin this listing</Text>
                </TouchableOpacity>
              )}
              {!reported ? (
                <TouchableOpacity style={s.reportMenuItem} onPress={() => { setReported(true); setShowReport(false); }}>
                  <Ionicons name="flag-outline" size={15} color="#EF4444" />
                  <Text style={[s.reportMenuTxt, { color:"#EF4444" }]}>Report listing</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.reportMenuItem}>
                  <Ionicons name="checkmark-circle" size={15} color="#15803D" />
                  <Text style={[s.reportMenuTxt, { color:"#15803D" }]}>Reported</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Hero image */}
          <View style={[s.hero, { backgroundColor:listing.imgBg }]}>
            <Ionicons name={listing.imgIcon} size={80} color={listing.imgColor} style={{ opacity:0.22 }} />
            <View style={[s.tagPill, { backgroundColor:listing.tagBg }]}>
              <Text style={[s.tagPillTxt, { color:listing.tagColor }]}>{listing.tag}</Text>
            </View>
          </View>

          <View style={s.body}>
            {/* Title & price */}
            <Text style={s.title}>{listing.title}</Text>
            <Text style={s.price}>{listing.priceStr}</Text>

            {/* Meta */}
            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
                <Text style={s.metaTxt}>{listing.views} views</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={s.metaTxt}>{listing.time}</Text>
              </View>
            </View>

            {/* Engagement */}
            <View style={s.engRow}>
              <TouchableOpacity style={s.engBtn} onPress={handleLike}>
                <Animated.View style={{ transform:[{scale:heartScale}] }}>
                  <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#EF4444" : "#6B7280"} />
                </Animated.View>
                <Text style={[s.engTxt, liked && { color:"#EF4444" }]}>{likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.engBtn} onPress={() => router.push(`/comments?id=${listing.id}&type=listing`)}>
                <Ionicons name="chatbubble-outline" size={19} color="#6B7280" />
                <Text style={s.engTxt}>{listing.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.engBtn} onPress={() => setSaved(v => !v)}>
                <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={19} color={saved ? "#1E3A8A" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            <View style={s.divider} />

            {/* Description */}
            <Text style={s.sectionLabel}>Description</Text>
            <Text style={s.description}>{listing.description}</Text>

            <View style={s.divider} />

            {/* Seller */}
            <Text style={s.sectionLabel}>Seller</Text>
            <TouchableOpacity
              style={s.sellerCard}
              onPress={() =>router.push(`/seller/${listing.seller.handle}`)}
            >
              <View style={[s.sellerAvatar, { backgroundColor:listing.seller.bg }]}>
                <Text style={[s.sellerInitials, { color:listing.seller.color }]}>{listing.seller.initials}</Text>
              </View>
              <View style={{ flex:1 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
                  <Text style={s.sellerName}>{listing.seller.name}</Text>
                  <View style={s.verifiedBadge}>
                    <Ionicons name="checkmark" size={9} color="#fff" />
                  </View>
                </View>
                <Text style={s.sellerDept}>{listing.seller.dept}</Text>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginTop:3 }}>
                  <Stars rating={listing.seller.rating} />
                  <Text style={s.sellerMeta}>
                    {listing.seller.rating} · {listing.seller.reviews} reviews · {listing.seller.sales} sales
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={s.divider} />

            {/* Safety note */}
            <View style={s.safetyCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1E3A8A" />
              <Text style={s.safetyTxt}>Only transact with verified AFIT students. Meet in a safe campus location.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        <TouchableOpacity style={s.msgBtn} onPress={async () => {
  try {
    const { conversation } = await api.conversations.start(seller.id);
    router.push(`/(tabs)/chat/${conversation.id}`);
  } catch (err) {
    router.push("/(tabs)/messages");
  }
}}>
          <Ionicons name="chatbubble-outline" size={18} color="#1E3A8A" />
          <Text style={s.msgBtnTxt}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push("/cart")}>
          <Ionicons name="bag-add-outline" size={17} color="#fff" />
          <Text style={s.cartBtnTxt}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  hBtn: { padding:6 },
  reportMenu: { position:"absolute", top:38, right:0, backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:10, elevation:10, zIndex:100, minWidth:160 },
  reportMenuItem: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  reportMenuTxt: { fontSize:13, fontWeight:"600", color:"#374151" },
  hero: { height:240, alignItems:"center", justifyContent:"center", position:"relative" },
  tagPill: { position:"absolute", top:14, left:14, paddingHorizontal:10, paddingVertical:4, borderRadius:12 },
  tagPillTxt: { fontSize:11, fontWeight:"700" },
  body: { padding:20 },
  title: { fontSize:22, fontWeight:"900", color:"#111827", letterSpacing:-0.4, lineHeight:28, marginBottom:6 },
  price: { fontSize:24, fontWeight:"900", color:"#1E3A8A", marginBottom:12 },
  metaRow: { flexDirection:"row", gap:16, marginBottom:14 },
  metaItem: { flexDirection:"row", alignItems:"center", gap:4 },
  metaTxt: { fontSize:12, color:"#9CA3AF" },
  engRow: { flexDirection:"row", gap:20, marginBottom:4 },
  engBtn: { flexDirection:"row", alignItems:"center", gap:6 },
  engTxt: { fontSize:14, color:"#6B7280", fontWeight:"500" },
  divider: { height:1, backgroundColor:"#F3F4F6", marginVertical:18 },
  sectionLabel: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 },
  description: { fontSize:14, color:"#374151", lineHeight:22 },
  sellerCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#F9FAFB", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  sellerAvatar: { width:48, height:48, borderRadius:24, alignItems:"center", justifyContent:"center" },
  sellerInitials: { fontSize:15, fontWeight:"800" },
  sellerName: { fontSize:14, fontWeight:"700", color:"#111827" },
  sellerDept: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  sellerMeta: { fontSize:11, color:"#9CA3AF" },
  verifiedBadge: { width:16, height:16, borderRadius:8, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  safetyCard: { flexDirection:"row", gap:10, backgroundColor:"#EFF6FF", borderRadius:14, padding:13, borderWidth:1, borderColor:"#BFDBFE" },
  safetyTxt: { flex:1, fontSize:12, color:"#3B82F6", lineHeight:18 },
  cta: { position:"absolute", bottom:0, left:0, right:0, flexDirection:"row", gap:12, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  msgBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, height:52, borderRadius:16, borderWidth:1.5, borderColor:"#BFDBFE", backgroundColor:"#EFF6FF" },
  msgBtnTxt: { fontSize:14, fontWeight:"700", color:"#1E3A8A" },
  cartBtn: { flex:2, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, height:52, borderRadius:16, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  cartBtnTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
});
