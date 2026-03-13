// app/(tabs)/saved.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, ScrollView, Platform, Modal, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const BADGE_COLORS = { Basic:"#0369A1", Pro:"#1E3A8A", Elite:"#7C3AED" };

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 172800)return "Yesterday";
  return `${Math.floor(diff/86400)}d ago`;
};

export default function Saved() {
  const [activeTab,   setActiveTab]   = useState("listings");
  const [listings,    setListings]    = useState([]);
  const [sellers,     setSellers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showSort,    setShowSort]    = useState(false);
  const [sortBy,      setSortBy]      = useState("recent");

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const tabFade   = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    try {
      const [lstRes, selRes] = await Promise.all([
        api.saved.listings.list(),
        api.saved.sellers.list(),
      ]);
      setListings(lstRes.listings || lstRes || []);
      setSellers(selRes.sellers  || selRes || []);
    } catch (err) {
      console.log("[saved error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const switchTab = (id) => {
    Animated.sequence([
      Animated.timing(tabFade, { toValue:0, duration:100, useNativeDriver:true }),
      Animated.timing(tabFade, { toValue:1, duration:200, useNativeDriver:true }),
    ]).start();
    setActiveTab(id);
  };

  const unsaveListing = async (id) => {
    setListings(prev => prev.filter(i => i.id !== id));
    try { await api.saved.listings.remove(id); } catch {}
  };

  const unsaveSeller = async (id) => {
    setSellers(prev => prev.filter(i => i.id !== id));
    try { await api.saved.sellers.remove(id); } catch {}
  };

  const TABS = [
    { id:"listings", label:"Listings",  icon:"pricetag-outline",   count: listings.length },
    { id:"sellers",  label:"Sellers",   icon:"storefront-outline",  count: sellers.length  },
  ];

  const totalCount = listings.length + sellers.length;

  // ── LISTING CARD ────────────────────────────────────────────────────────────
  const ListingCard = ({ item }) => {
    const listing = item.listing || item;
    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/(tabs)/listing/${listing.id}`)} activeOpacity={0.88}>
        <View style={[s.cardImg, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="pricetag-outline" size={26} color="#1E3A8A" />
        </View>
        <View style={s.cardBody}>
          <View style={[s.tagPill, { backgroundColor:"#DBEAFE" }]}>
            <Text style={[s.tagTxt, { color:"#1E3A8A" }]}>{listing.category || "Item"}</Text>
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={s.cardPrice}>₦{Number(listing.price||0).toLocaleString()}</Text>
          <Text style={s.cardMeta}>by {listing.seller?.name || "Seller"} · {timeAgo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity style={s.unsaveBtn} onPress={() => unsaveListing(listing.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Ionicons name="bookmark" size={20} color="#1E3A8A" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ── SELLER CARD ─────────────────────────────────────────────────────────────
  const SellerCard = ({ item }) => {
    const seller = item.seller || item;
    const badgeColor = BADGE_COLORS[seller.plan] || "#6B7280";
    const initials = (seller.name||"S").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase();
    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/(tabs)/seller/${seller.username || seller.id}`)} activeOpacity={0.88}>
        <View style={[s.avatar, { backgroundColor:"#DCFCE7" }]}>
          <Text style={[s.avatarTxt, { color:"#15803D" }]}>{initials}</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.sellerNameRow}>
            <Text style={s.cardTitle}>{seller.name}</Text>
            {seller.plan && (
              <View style={[s.sellerBadge, { backgroundColor:badgeColor+"18", borderColor:badgeColor+"40" }]}>
                <Text style={[s.sellerBadgeTxt, { color:badgeColor }]}>{seller.plan}</Text>
              </View>
            )}
          </View>
          <Text style={s.cardMeta}>@{seller.username || ""}</Text>
          <View style={s.sellerStats}>
            {seller.totalListings != null && (
              <View style={s.statItem}>
                <Ionicons name="list-outline" size={12} color="#9CA3AF" />
                <Text style={s.statTxt}>{seller.totalListings} listings</Text>
              </View>
            )}
            {seller.rating != null && (
              <View style={s.statItem}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={s.statTxt}>{seller.rating}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={s.unsaveBtn} onPress={() => unsaveSeller(seller.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Ionicons name="bookmark" size={20} color="#1E3A8A" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const EmptyState = ({ tab }) => {
    const map = {
      listings: { icon:"pricetag-outline",   msg:"No saved listings yet",  sub:"Tap the bookmark icon on any listing to save it here." },
      sellers:  { icon:"storefront-outline", msg:"No saved sellers yet",   sub:"Follow sellers you like to keep track of their shops."  },
    };
    const { icon, msg, sub } = map[tab] || map.listings;
    return (
      <View style={s.empty}>
        <View style={s.emptyIconWrap}><Ionicons name={icon} size={36} color="#D1D5DB" /></View>
        <Text style={s.emptyTitle}>{msg}</Text>
        <Text style={s.emptySub}>{sub}</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()}>
          <Text style={s.emptyBtnTxt}>Browse now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const data     = activeTab === "listings" ? listings : sellers;
  const renderItem = ({ item }) => activeTab === "listings"
    ? <ListingCard item={item} />
    : <SellerCard  item={item} />;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <Animated.View style={[s.header, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Saved</Text>
          <Text style={s.headerSub}>{totalCount} items saved</Text>
        </View>
        <TouchableOpacity style={s.headerIcon} onPress={() => setShowSort(true)}>
          <Ionicons name="funnel-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={{ paddingHorizontal:12, gap:8, alignItems:"center" }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={[s.tab, active && s.tabActive]} onPress={() => switchTab(tab.id)} activeOpacity={0.8}>
              <Ionicons name={tab.icon} size={14} color={active ? "#fff" : "#6B7280"} />
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>{tab.label}</Text>
              <View style={[s.tabCount, active && s.tabCountActive]}>
                <Text style={[s.tabCountTxt, active && s.tabCountTxtActive]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Animated.View style={{ flex:1, opacity:tabFade }}>
        {data.length === 0 && !loading ? (
          <EmptyState tab={activeTab} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding:16, gap:12, paddingBottom:32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#F97316"]} />}
          />
        )}
      </Animated.View>

      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <TouchableOpacity style={s.sortBackdrop} activeOpacity={1} onPress={() => setShowSort(false)} />
        <View style={s.sortSheet}>
          <Text style={s.sortTitle}>Sort saved items</Text>
          {[
            { id:"recent",     label:"Most recently saved" },
            { id:"price_low",  label:"Price: Low to High"  },
            { id:"price_high", label:"Price: High to Low"  },
          ].map(opt => (
            <TouchableOpacity key={opt.id} style={s.sortRow} onPress={() => { setSortBy(opt.id); setShowSort(false); }}>
              <Text style={[s.sortRowTxt, sortBy === opt.id && s.sortRowTxtActive]}>{opt.label}</Text>
              {sortBy === opt.id && <Ionicons name="checkmark" size={16} color="#1E3A8A" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"900", color:"#fff", textAlign:"center" },
  headerSub: { fontSize:11, color:"#93C5FD", textAlign:"center" },
  headerIcon: { width:36, height:36, borderRadius:18, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center" },
  sortBackdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.35)" },
  sortSheet: { backgroundColor:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:Platform.OS==="ios"?36:24 },
  sortTitle: { fontSize:15, fontWeight:"800", color:"#111827", marginBottom:16 },
  sortRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  sortRowTxt: { fontSize:14, fontWeight:"500", color:"#374151" },
  sortRowTxtActive: { fontWeight:"800", color:"#1E3A8A" },
  tabBar: { backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6", maxHeight:56, flexGrow:0 },
  tab: { flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:20, backgroundColor:"#F3F4F6" },
  tabActive: { backgroundColor:"#1E3A8A" },
  tabTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  tabTxtActive: { color:"#fff", fontWeight:"700" },
  tabCount: { minWidth:18, height:18, borderRadius:9, backgroundColor:"#E5E7EB", alignItems:"center", justifyContent:"center", paddingHorizontal:4 },
  tabCountActive: { backgroundColor:"rgba(255,255,255,0.25)" },
  tabCountTxt: { fontSize:10, fontWeight:"800", color:"#6B7280" },
  tabCountTxtActive: { color:"#fff" },
  card: { flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"#fff", borderRadius:20, padding:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardImg: { width:60, height:60, borderRadius:16, alignItems:"center", justifyContent:"center", flexShrink:0 },
  cardBody: { flex:1, gap:4 },
  cardTitle: { fontSize:14, fontWeight:"700", color:"#111827", lineHeight:20 },
  cardPrice: { fontSize:14, fontWeight:"900", color:"#1E3A8A" },
  cardMeta: { fontSize:11, color:"#9CA3AF", lineHeight:16 },
  unsaveBtn: { padding:4, marginTop:2 },
  tagPill: { alignSelf:"flex-start", paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  tagTxt: { fontSize:10, fontWeight:"700" },
  avatar: { width:52, height:52, borderRadius:26, alignItems:"center", justifyContent:"center", flexShrink:0 },
  avatarTxt: { fontSize:16, fontWeight:"800" },
  sellerNameRow: { flexDirection:"row", alignItems:"center", gap:8, flexWrap:"wrap" },
  sellerBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1 },
  sellerBadgeTxt: { fontSize:10, fontWeight:"800" },
  sellerStats: { flexDirection:"row", gap:12, marginTop:2 },
  statItem: { flexDirection:"row", alignItems:"center", gap:4 },
  statTxt: { fontSize:11, color:"#6B7280", fontWeight:"500" },
  empty: { flex:1, alignItems:"center", justifyContent:"center", padding:40, gap:12 },
  emptyIconWrap: { width:80, height:80, borderRadius:40, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center", marginBottom:4 },
  emptyTitle: { fontSize:16, fontWeight:"800", color:"#374151", textAlign:"center" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center", lineHeight:20 },
  emptyBtn: { marginTop:8, paddingHorizontal:20, paddingVertical:10, borderRadius:14, backgroundColor:"#1E3A8A" },
  emptyBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
});