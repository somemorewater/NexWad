// app/(tabs)/marketplace.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, ScrollView, TextInput,
  Dimensions, Platform, Modal, RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

const CATEGORIES = [
  { id:"all",         label:"All",         icon:"grid-outline"       },
  { id:"Textbooks",   label:"Textbooks",   icon:"book-outline"       },
  { id:"Electronics", label:"Electronics", icon:"flash-outline"      },
  { id:"Food",        label:"Food",        icon:"restaurant-outline" },
  { id:"Services",    label:"Services",    icon:"briefcase-outline"  },
  { id:"Fashion",     label:"Fashion",     icon:"shirt-outline"      },
  { id:"Housing",     label:"Housing",     icon:"home-outline"       },
  { id:"Stationery",  label:"Stationery",  icon:"pencil-outline"     },
];

const SORT_OPTIONS = [
  { id:"newest",     label:"Newest First"       },
  { id:"price_asc",  label:"Price: Low to High" },
  { id:"price_desc", label:"Price: High to Low" },
  { id:"popular",    label:"Most Popular"       },
];

const LF_CATEGORIES = [
  { id:"all",         label:"All"         },
  { id:"electronics", label:"Electronics" },
  { id:"clothing",    label:"Clothing"    },
  { id:"accessories", label:"Accessories" },
  { id:"documents",   label:"Documents"   },
  { id:"keys",        label:"Keys / ID"   },
  { id:"books",       label:"Books"       },
  { id:"other",       label:"Other"       },
];

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const NAV_TABS = [
  { key:"home",        iconFill:"home",       iconLine:"home-outline",       label:"Home",    route:"/(tabs)/feed"        },
  { key:"discover",    iconFill:"compass",    iconLine:"compass-outline",    label:"Discover",route:"/(tabs)/discover"    },
  { key:"marketplace", iconFill:"storefront", iconLine:"storefront-outline", label:"Market",  route:"/(tabs)/marketplace" },
  { key:"profile",     iconFill:"person",     iconLine:"person-outline",     label:"Profile", route:"/(tabs)/profile"     },
];
const BottomNav = ({ active }) => (
  <View style={N.bar}>
    {NAV_TABS.map(tab => {
      const on = tab.key === active;
      return (
        <TouchableOpacity key={tab.key} style={N.tab} onPress={() => router.push(tab.route)} activeOpacity={0.7}>
          {on && <View style={N.pip} />}
          <Ionicons name={on ? tab.iconFill : tab.iconLine} size={24} color={on ? "#F97316" : "#9CA3AF"} />
          <Text style={[N.lbl, on && N.lblOn]}>{tab.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
const N = StyleSheet.create({
  bar: { flexDirection:"row", backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6", paddingBottom:Platform.OS==="ios"?20:8, paddingTop:8, paddingHorizontal:8, shadowColor:"#000", shadowOffset:{width:0,height:-3}, shadowOpacity:0.06, shadowRadius:10, elevation:10 },
  tab: { flex:1, alignItems:"center", justifyContent:"center", paddingVertical:4, position:"relative" },
  pip: { position:"absolute", top:-8, width:28, height:3, borderRadius:2, backgroundColor:"#F97316" },
  lbl: { fontSize:10, color:"#9CA3AF", fontWeight:"500", marginTop:2 },
  lblOn: { color:"#F97316", fontWeight:"700" },
});

// ─── FLOATING CART ────────────────────────────────────────────────────────────
const FloatingCart = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue:0.88, useNativeDriver:true, speed:60 }),
      Animated.spring(scale, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    router.push("/(tabs)/cart");
  };
  return (
    <Animated.View style={[FC.wrap, { transform:[{scale}] }]}>
      <TouchableOpacity style={FC.btn} onPress={press} activeOpacity={1}>
        <Ionicons name="bag-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};
const FC = StyleSheet.create({
  wrap: { position:"absolute", bottom:Platform.OS==="ios"?92:76, right:16, zIndex:100 },
  btn: { width:52, height:52, borderRadius:26, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.32, shadowRadius:14, elevation:12 },
});

// ─── STARS ────────────────────────────────────────────────────────────────────
const Stars = ({ rating }) => (
  <View style={{ flexDirection:"row", gap:1 }}>
    {Array.from({length:5}).map((_,i) => (
      <Ionicons key={i}
        name={i<Math.floor(rating)?"star":i===Math.floor(rating)&&rating%1>=0.5?"star-half":"star-outline"}
        size={10} color={i<Math.ceil(rating)?"#F59E0B":"#D1D5DB"}
      />
    ))}
  </View>
);

// ─── GRID CARD ────────────────────────────────────────────────────────────────
const GridCard = ({ item, index }) => {
  const [saved,    setSaved]    = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:360, delay:index*55, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:360, delay:index*55, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    setSaved(v => !v);
    try { await api.saved.listings.toggle(item.id); } catch {}
  };

  const handleAddToCart = async () => {
    try {
      await api.cart.add(item.id);
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 1500);
    } catch {
      router.push("/(tabs)/cart");
    }
  };

  const price  = Number(item.price || 0);
  const rating = Number(item.averageRating || item.rating || 0);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:CARD_W }}>
      <TouchableOpacity style={GC.card} activeOpacity={0.93} onPress={() => router.push(`/(tabs)/listing/${item.id}`)}>
        <View style={[GC.img, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="pricetag-outline" size={38} color="#1E3A8A" style={{ opacity:0.28 }} />
          <TouchableOpacity style={GC.saveBtn} onPress={handleSave}>
            <Ionicons name={saved?"bookmark":"bookmark-outline"} size={14} color={saved?"#1E3A8A":"#9CA3AF"} />
          </TouchableOpacity>
        </View>
        <View style={GC.info}>
          <View style={[GC.tag, { backgroundColor:"#DBEAFE" }]}>
            <Text style={[GC.tagTxt, { color:"#1E3A8A" }]}>{item.category || "Item"}</Text>
          </View>
          <Text style={GC.title} numberOfLines={2}>{item.title}</Text>
          {rating > 0 && (
            <View style={GC.ratingRow}>
              <Stars rating={rating} />
              <Text style={GC.reviewCnt}>({item.reviewCount || 0})</Text>
            </View>
          )}
          <Text style={GC.seller}>by {item.seller?.name || "Seller"}</Text>
          <View style={GC.footer}>
            <Text style={GC.price}>₦{price.toLocaleString()}</Text>
            <TouchableOpacity style={[GC.addBtn, addedMsg && { backgroundColor:"#22C55E" }]} onPress={handleAddToCart}>
              <Ionicons name={addedMsg ? "checkmark" : "add"} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
const GC = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, marginBottom:16 },
  img: { height:108, alignItems:"center", justifyContent:"center", position:"relative" },
  saveBtn: { position:"absolute", top:7, right:7, width:26, height:26, borderRadius:13, backgroundColor:"rgba(255,255,255,0.92)", alignItems:"center", justifyContent:"center" },
  info: { padding:10 },
  tag: { alignSelf:"flex-start", paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginBottom:4 },
  tagTxt: { fontSize:9, fontWeight:"700", letterSpacing:0.3 },
  title: { fontSize:12, fontWeight:"700", color:"#111827", lineHeight:17, marginBottom:4 },
  ratingRow: { flexDirection:"row", alignItems:"center", gap:3, marginBottom:2 },
  reviewCnt: { fontSize:9, color:"#9CA3AF" },
  seller: { fontSize:10, color:"#9CA3AF", marginBottom:7 },
  footer: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  price: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  addBtn: { width:26, height:26, borderRadius:13, backgroundColor:"#F97316", alignItems:"center", justifyContent:"center" },
});

// ─── LF CARD ──────────────────────────────────────────────────────────────────
const LFCard = ({ item, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:340, delay:index*70, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:340, delay:index*70, useNativeDriver:true }),
    ]).start();
  }, []);

  const isLost = item.type === "lost";
  const typeStyle = isLost
    ? { pillBg:"#FEF2F2", pillColor:"#DC2626", pillLabel:"Lost",  pillIcon:"alert-circle-outline"     }
    : { pillBg:"#F0FDF4", pillColor:"#15803D", pillLabel:"Found", pillIcon:"checkmark-circle-outline" };

  const poster = item.poster || item.user || {};
  const initials = (poster.name||"U").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase();

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity style={[LF.card, item.resolved && LF.cardResolved]} activeOpacity={0.91}
        onPress={() => router.push(`/(tabs)/lost-found/${item.id}`)}>
        <View style={[LF.accentBar, { backgroundColor:isLost?"#EF4444":"#22C55E" }]} />
        <View style={[LF.iconWrap, { backgroundColor:"#1E3A8A22" }]}>
          <Ionicons name="search-outline" size={26} color="#1E3A8A" />
        </View>
        <View style={{ flex:1 }}>
          <View style={LF.topRow}>
            <View style={[LF.typePill, { backgroundColor:typeStyle.pillBg }]}>
              <Ionicons name={typeStyle.pillIcon} size={11} color={typeStyle.pillColor} />
              <Text style={[LF.typeTxt, { color:typeStyle.pillColor }]}>{typeStyle.pillLabel}</Text>
            </View>
            {item.reward && (
              <View style={LF.rewardPill}>
                <Ionicons name="gift-outline" size={10} color="#B45309" />
                <Text style={LF.rewardTxt}>{item.reward}</Text>
              </View>
            )}
            {item.resolved && <View style={LF.resolvedPill}><Text style={LF.resolvedTxt}>Resolved</Text></View>}
          </View>
          <Text style={[LF.title, item.resolved && LF.titleResolved]} numberOfLines={1}>{item.title}</Text>
          <Text style={LF.desc} numberOfLines={2}>{item.description}</Text>
          <View style={LF.footer}>
            <View style={LF.footerLeft}>
              {item.location && (
                <View style={LF.locationRow}>
                  <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                  <Text style={LF.locationTxt}>{item.location}</Text>
                </View>
              )}
              <View style={LF.locationRow}>
                <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                <Text style={LF.locationTxt}>{item.date || item.createdAt?.slice(0,10) || ""}</Text>
              </View>
            </View>
            <View style={LF.posterRow}>
              <View style={[LF.posterAvatar, { backgroundColor:"#DCFCE7" }]}>
                <Text style={[LF.posterInit, { color:"#15803D" }]}>{initials}</Text>
              </View>
              {!item.resolved && (
                <TouchableOpacity style={LF.contactBtn} onPress={() => router.push("/(tabs)/messages")}>
                  <Text style={LF.contactTxt}>{isLost?"I Found It":"It's Mine"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
const LF = StyleSheet.create({
  card: { flexDirection:"row", backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, marginBottom:12, gap:12 },
  cardResolved: { opacity:0.6 },
  accentBar: { width:4 },
  iconWrap: { width:52, alignItems:"center", justifyContent:"center", marginVertical:14 },
  topRow: { flexDirection:"row", alignItems:"center", gap:7, marginTop:12, marginBottom:6, flexWrap:"wrap" },
  typePill: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  typeTxt: { fontSize:10, fontWeight:"800" },
  rewardPill: { flexDirection:"row", alignItems:"center", gap:3, backgroundColor:"#FEF9C3", paddingHorizontal:7, paddingVertical:3, borderRadius:10 },
  rewardTxt: { fontSize:10, fontWeight:"700", color:"#B45309" },
  resolvedPill: { backgroundColor:"#F3F4F6", paddingHorizontal:7, paddingVertical:3, borderRadius:10 },
  resolvedTxt: { fontSize:10, fontWeight:"700", color:"#9CA3AF" },
  title: { fontSize:14, fontWeight:"800", color:"#111827", marginBottom:4, paddingRight:12 },
  titleResolved: { textDecorationLine:"line-through", color:"#9CA3AF" },
  desc: { fontSize:12, color:"#6B7280", lineHeight:17, marginBottom:10, paddingRight:12 },
  footer: { flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between", marginBottom:12, paddingRight:12 },
  footerLeft: { gap:3 },
  locationRow: { flexDirection:"row", alignItems:"center", gap:4 },
  locationTxt: { fontSize:11, color:"#9CA3AF" },
  posterRow: { flexDirection:"row", alignItems:"center", gap:8 },
  posterAvatar: { width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center" },
  posterInit: { fontSize:9, fontWeight:"800" },
  contactBtn: { backgroundColor:"#1E3A8A", paddingHorizontal:12, paddingVertical:6, borderRadius:12 },
  contactTxt: { fontSize:11, fontWeight:"700", color:"#fff" },
});

// ─── FILTER SHEET ─────────────────────────────────────────────────────────────
const FilterSheet = ({ visible, onClose, priceRange, setPriceRange, sortBy, setSortBy, onApply }) => {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue:visible?0:600, useNativeDriver:true, damping:22, stiffness:220 }),
      Animated.timing(fadeAnim,  { toValue:visible?1:0, duration:visible?240:180, useNativeDriver:true }),
    ]).start();
  }, [visible]);
  const PRICE_RANGES = [
    { id:"any",   label:"Any Price"         },
    { id:"u1k",   label:"Under ₦1,000"      },
    { id:"1k5k",  label:"₦1,000 – ₦5,000"  },
    { id:"5k10k", label:"₦5,000 – ₦10,000" },
    { id:"10k+",  label:"₦10,000+"          },
  ];
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[FS.backdrop, { opacity:fadeAnim }]}>
        <TouchableOpacity style={{ flex:1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[FS.sheet, { transform:[{translateY:slideAnim}] }]}>
        <View style={FS.handle} />
        <View style={FS.sheetHeader}>
          <Text style={FS.sheetTitle}>Filter & Sort</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#374151" /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={FS.groupTitle}>Sort By</Text>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.id} style={FS.optRow} onPress={() => setSortBy(opt.id)}>
              <Text style={[FS.optLabel, sortBy===opt.id && FS.optLabelOn]}>{opt.label}</Text>
              <View style={[FS.radio, sortBy===opt.id && FS.radioOn]}>
                {sortBy===opt.id && <View style={FS.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
          <Text style={[FS.groupTitle, { marginTop:20 }]}>Price Range</Text>
          {PRICE_RANGES.map(p => (
            <TouchableOpacity key={p.id} style={FS.optRow} onPress={() => setPriceRange(p.id)}>
              <Text style={[FS.optLabel, priceRange===p.id && FS.optLabelOn]}>{p.label}</Text>
              <View style={[FS.radio, priceRange===p.id && FS.radioOn]}>
                {priceRange===p.id && <View style={FS.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={FS.applyBtn} onPress={() => { onApply(); onClose(); }}>
          <Text style={FS.applyTxt}>Apply Filters</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};
const FS = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.45)" },
  sheet: { position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:20, paddingBottom:Platform.OS==="ios"?36:24, maxHeight:"80%", shadowColor:"#000", shadowOffset:{width:0,height:-4}, shadowOpacity:0.1, shadowRadius:20, elevation:20 },
  handle: { width:40, height:4, borderRadius:2, backgroundColor:"#E5E7EB", alignSelf:"center", marginTop:12, marginBottom:4 },
  sheetHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F3F4F6", marginBottom:4 },
  sheetTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  groupTitle: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginTop:16, marginBottom:8 },
  optRow: { flexDirection:"row", alignItems:"center", paddingVertical:13, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  optLabel: { flex:1, fontSize:15, color:"#374151", fontWeight:"500" },
  optLabelOn: { color:"#1E3A8A", fontWeight:"700" },
  radio: { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:"#D1D5DB", alignItems:"center", justifyContent:"center" },
  radioOn: { borderColor:"#1E3A8A" },
  radioDot: { width:10, height:10, borderRadius:5, backgroundColor:"#1E3A8A" },
  applyBtn: { backgroundColor:"#1E3A8A", height:54, borderRadius:18, alignItems:"center", justifyContent:"center", marginTop:20, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.25, shadowRadius:14, elevation:8 },
  applyTxt: { fontSize:16, fontWeight:"700", color:"#fff" },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Marketplace() {
  const params = useLocalSearchParams();

  const [mode,           setMode]           = useState("market");
  const [activeCategory, setActiveCategory] = useState(params.category || "all");
  const [lfCategory,     setLfCategory]     = useState("all");
  const [lfFilter,       setLfFilter]       = useState("all");
  const [query,          setQuery]          = useState("");
  const [sortBy,         setSortBy]         = useState("newest");
  const [priceRange,     setPriceRange]     = useState("any");
  const [filterOpen,     setFilterOpen]     = useState(false);

  // Real data
  const [listings,    setListings]    = useState([]);
  const [lfItems,     setLfItems]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const modeAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-14)).current;

  // ── Load listings ──
  const loadListings = useCallback(async () => {
    try {
      const params = { page:1, limit:40, sort:sortBy };
      if (activeCategory !== "all") params.category = activeCategory;
      if (query.trim()) params.search = query;
      if (priceRange === "u1k")   { params.minPrice = 0; params.maxPrice = 999; }
      if (priceRange === "1k5k")  { params.minPrice = 1000; params.maxPrice = 5000; }
      if (priceRange === "5k10k") { params.minPrice = 5001; params.maxPrice = 10000; }
      if (priceRange === "10k+")  { params.minPrice = 10001; }
      const res = await api.listings.list(params);
      setListings(res.listings || res || []);
    } catch (err) {
      console.log("[marketplace listings error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, query, sortBy, priceRange]);

  const loadLostFound = useCallback(async () => {
    try {
      const p = {};
      if (lfFilter !== "all") p.type = lfFilter;
      if (lfCategory !== "all") p.category = lfCategory;
      if (query.trim()) p.search = query;
      const res = await api.lostFound.list(p);
      setLfItems(res.items || res || []);
    } catch (err) {
      console.log("[lost found error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lfFilter, lfCategory, query]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:480, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:480, useNativeDriver:true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (mode === "market") loadListings();
    else loadLostFound();
  }, [mode, activeCategory, lfFilter, lfCategory, sortBy, priceRange]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === "market") loadListings();
      else loadLostFound();
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const switchMode = (m) => {
    Animated.spring(modeAnim, { toValue:m==="market"?0:1, useNativeDriver:false, damping:20, stiffness:200 }).start();
    setMode(m);
    setQuery("");
    setActiveCategory("all");
    setLfCategory("all");
    setLfFilter("all");
    setLoading(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (mode === "market") loadListings();
    else loadLostFound();
  };

  const productRows = [];
  for (let i = 0; i < listings.length; i += 2) productRows.push(listings.slice(i, i+2));

  const activeFiltersCount = (sortBy !== "newest" ? 1 : 0) + (priceRange !== "any" ? 1 : 0);
  const lfLost  = lfItems.filter(i => !i.resolved && i.type === "lost").length;
  const lfFound = lfItems.filter(i => !i.resolved && i.type === "found").length;
  const modeIndicatorLeft = modeAnim.interpolate({ inputRange:[0,1], outputRange:["2%","52%"] });

  const TopBar = () => (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <View style={M.header}>
        <View>
          <Text style={M.headerSup}>AFIT Campus</Text>
          <Text style={M.headerTitle}>{mode==="market" ? "Marketplace" : "Lost & Found"}</Text>
        </View>
        <View style={M.headerRight}>
          <TouchableOpacity style={M.postBtn} onPress={() => router.push(mode==="market"?"/(tabs)/new-listing":"/(tabs)/new-lost-found")}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={M.postBtnTxt}>{mode==="market"?"Sell":"Post"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/notifications")} style={{ position:"relative" }}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            <View style={M.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={M.modeSwitcher}>
        <Animated.View style={[M.modeIndicator, { left:modeIndicatorLeft }]} />
        <TouchableOpacity style={M.modeBtn} onPress={() => switchMode("market")} activeOpacity={0.85}>
          <Ionicons name={mode==="market"?"storefront":"storefront-outline"} size={15} color={mode==="market"?"#1E3A8A":"#9CA3AF"} />
          <Text style={[M.modeTxt, mode==="market" && M.modeTxtOn]}>Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={M.modeBtn} onPress={() => switchMode("lostfound")} activeOpacity={0.85}>
          <Ionicons name={mode==="lostfound"?"search":"search-outline"} size={15} color={mode==="lostfound"?"#1E3A8A":"#9CA3AF"} />
          <Text style={[M.modeTxt, mode==="lostfound" && M.modeTxtOn]}>Lost & Found</Text>
          {(lfLost+lfFound) > 0 && <View style={M.lfBadge}><Text style={M.lfBadgeTxt}>{lfLost+lfFound}</Text></View>}
        </TouchableOpacity>
      </View>

      <View style={M.searchRow}>
        <View style={M.searchWrap}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            style={M.searchInput}
            placeholder={mode==="market"?"Search listings…":"Search lost & found…"}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={17} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
        {mode === "market" && (
          <TouchableOpacity
            style={[M.filterBtn, activeFiltersCount>0 && M.filterBtnActive]}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons name="options-outline" size={18} color={activeFiltersCount>0?"#fff":"#374151"} />
            {activeFiltersCount > 0 && (
              <View style={M.filterBadge}><Text style={M.filterBadgeTxt}>{activeFiltersCount}</Text></View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  // ── MARKETPLACE MODE ──────────────────────────────────────────────────────
  if (mode === "market") {
    const MarketHeader = () => (
      <View>
        <View style={M.catRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal:14, gap:8, paddingVertical:8 }}>
            {CATEGORIES.map(item => {
              const on = item.id === activeCategory;
              return (
                <TouchableOpacity key={item.id} style={[M.catChip, on && M.catChipOn]}
                  onPress={() => setActiveCategory(item.id)}>
                  <Ionicons name={item.icon} size={13} color={on?"#fff":"#6B7280"} />
                  <Text style={[M.catTxt, on && M.catTxtOn]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={M.resultsBar}>
          <Text style={M.resultsTxt}>
            <Text style={M.resultsCount}>{listings.length}</Text> listing{listings.length!==1?"s":""}
            {activeCategory!=="all" ? ` in ${activeCategory}` : ""}
          </Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={() => { setSortBy("newest"); setPriceRange("any"); }}>
              <Text style={M.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
        {!loading && listings.length === 0 && (
          <View style={M.empty}>
            <Ionicons name="search-outline" size={44} color="#D1D5DB" />
            <Text style={M.emptyTitle}>No listings found</Text>
            <Text style={M.emptySub}>Try a different category or search term</Text>
          </View>
        )}
      </View>
    );

    return (
      <SafeAreaView style={M.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <TopBar />
        <FlatList
          data={productRows}
          keyExtractor={(_, i) => `row-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:16, paddingBottom:110 }}
          ListHeaderComponent={<MarketHeader />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#F97316"]} />}
          renderItem={({ item: row, index: ri }) => (
            <View style={M.gridRow}>
              {row.map((item, ci) => <GridCard key={item.id} item={item} index={ri*2+ci} />)}
              {row.length === 1 && <View style={{ width:CARD_W }} />}
            </View>
          )}
        />
        <FilterSheet
          visible={filterOpen} onClose={() => setFilterOpen(false)}
          priceRange={priceRange} setPriceRange={setPriceRange}
          sortBy={sortBy} setSortBy={setSortBy}
          onApply={() => {}}
        />
        <FloatingCart />
        <BottomNav active="marketplace" />
      </SafeAreaView>
    );
  }

  // ── LOST & FOUND MODE ─────────────────────────────────────────────────────
  const LFHeader = () => (
    <View>
      <View style={LFM.statsBanner}>
        <TouchableOpacity style={[LFM.statCard, lfFilter==="lost" && LFM.statCardActive]}
          onPress={() => setLfFilter(f => f==="lost"?"all":"lost")}>
          <View style={LFM.statIconWrap}><Ionicons name="alert-circle-outline" size={18} color="#EF4444" /></View>
          <Text style={LFM.statNum}>{lfLost}</Text>
          <Text style={LFM.statLbl}>Lost Items</Text>
        </TouchableOpacity>
        <View style={LFM.statDivider} />
        <TouchableOpacity style={[LFM.statCard, lfFilter==="found" && LFM.statCardActive]}
          onPress={() => setLfFilter(f => f==="found"?"all":"found")}>
          <View style={LFM.statIconWrap}><Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" /></View>
          <Text style={LFM.statNum}>{lfFound}</Text>
          <Text style={LFM.statLbl}>Found Items</Text>
        </TouchableOpacity>
        <View style={LFM.statDivider} />
        <View style={LFM.statCard}>
          <View style={LFM.statIconWrap}><Ionicons name="checkmark-done-outline" size={18} color="#9CA3AF" /></View>
          <Text style={LFM.statNum}>{lfItems.filter(i=>i.resolved).length}</Text>
          <Text style={LFM.statLbl}>Resolved</Text>
        </View>
      </View>

      <View style={LFM.filterRow}>
        {[
          { id:"all",   label:"All Items", icon:"grid-outline"             },
          { id:"lost",  label:"Lost",      icon:"alert-circle-outline"     },
          { id:"found", label:"Found",     icon:"checkmark-circle-outline" },
        ].map(f => {
          const on = lfFilter === f.id;
          return (
            <TouchableOpacity key={f.id} style={[LFM.filterPill,
              on && f.id==="lost"  && LFM.filterPillLost,
              on && f.id==="found" && LFM.filterPillFound,
              on && f.id==="all"   && LFM.filterPillAll,
            ]} onPress={() => setLfFilter(f.id)}>
              <Ionicons name={f.icon} size={13}
                color={on?(f.id==="lost"?"#DC2626":f.id==="found"?"#15803D":"#1E3A8A"):"#9CA3AF"} />
              <Text style={[LFM.filterPillTxt,
                on && f.id==="lost"  && { color:"#DC2626" },
                on && f.id==="found" && { color:"#15803D" },
                on && f.id==="all"   && { color:"#1E3A8A" },
              ]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:14, gap:8, paddingVertical:6 }}>
        {LF_CATEGORIES.map(item => {
          const on = item.id === lfCategory;
          return (
            <TouchableOpacity key={item.id}
              style={[M.catChip, on && M.catChipOn, { paddingHorizontal:12 }]}
              onPress={() => setLfCategory(item.id)}>
              <Text style={[M.catTxt, on && M.catTxtOn]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal:16, paddingTop:10 }}>
        <View style={LFM.infoNote}>
          <Ionicons name="information-circle-outline" size={15} color="#3B82F6" />
          <Text style={LFM.infoNoteTxt}>
            Lost something? Post it and the AFIT community will help you find it. Found something? Post it here so the owner can claim it.
          </Text>
        </View>
        <View style={M.resultsBar}>
          <Text style={M.resultsTxt}>
            <Text style={M.resultsCount}>{lfItems.length}</Text> item{lfItems.length!==1?"s":""}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/new-lost-found")}>
            <Text style={[M.clearFilters, { color:"#1E3A8A" }]}>+ Post Item</Text>
          </TouchableOpacity>
        </View>
        {!loading && lfItems.length === 0 && (
          <View style={M.empty}>
            <Ionicons name="search-outline" size={44} color="#D1D5DB" />
            <Text style={M.emptyTitle}>No items found</Text>
            <Text style={M.emptySub}>Try a different filter</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={M.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TopBar />
      <FlatList
        data={lfItems}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:16, paddingBottom:110 }}
        ListHeaderComponent={<LFHeader />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#F97316"]} />}
        renderItem={({ item, index }) => <LFCard item={item} index={index} />}
      />
      <BottomNav active="marketplace" />
    </SafeAreaView>
  );
}

const M = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerSup: { fontSize:11, fontWeight:"700", color:"#F97316", letterSpacing:1, textTransform:"uppercase" },
  headerTitle: { fontSize:26, fontWeight:"900", color:"#111827", letterSpacing:-0.5, marginTop:1 },
  headerRight: { flexDirection:"row", alignItems:"center", gap:12 },
  postBtn: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#F97316", paddingHorizontal:14, paddingVertical:8, borderRadius:20 },
  postBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
  notifDot: { position:"absolute", top:-1, right:-1, width:7, height:7, borderRadius:4, backgroundColor:"#F97316", borderWidth:1.5, borderColor:"#fff" },
  modeSwitcher: { flexDirection:"row", marginHorizontal:16, marginVertical:10, backgroundColor:"#F3F4F6", borderRadius:16, padding:4, position:"relative" },
  modeIndicator: { position:"absolute", top:4, width:"48%", height:"100%", backgroundColor:"#fff", borderRadius:13, shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:4, elevation:3 },
  modeBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, paddingVertical:9, borderRadius:12, zIndex:1 },
  modeTxt: { fontSize:13, fontWeight:"600", color:"#9CA3AF" },
  modeTxtOn: { color:"#1E3A8A", fontWeight:"700" },
  lfBadge: { backgroundColor:"#F97316", borderRadius:8, minWidth:16, height:16, alignItems:"center", justifyContent:"center", paddingHorizontal:4 },
  lfBadgeTxt: { fontSize:9, fontWeight:"900", color:"#fff" },
  searchRow: { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingBottom:10, gap:8 },
  searchWrap: { flex:1, flexDirection:"row", alignItems:"center", backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:44, gap:8 },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  filterBtn: { width:44, height:44, borderRadius:14, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  filterBtnActive: { backgroundColor:"#1E3A8A" },
  filterBadge: { position:"absolute", top:-3, right:-3, width:16, height:16, borderRadius:8, backgroundColor:"#F97316", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#fff" },
  filterBadgeTxt: { fontSize:8, fontWeight:"900", color:"#fff" },
  catRow: { borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  catChip: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:"#F9FAFB", borderWidth:1, borderColor:"#E5E7EB" },
  catChipOn: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  catTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  catTxtOn: { color:"#fff" },
  resultsBar: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:10, marginBottom:4 },
  resultsTxt: { fontSize:13, color:"#6B7280" },
  resultsCount: { fontWeight:"800", color:"#111827" },
  clearFilters: { fontSize:13, fontWeight:"600", color:"#EF4444" },
  gridRow: { flexDirection:"row", gap:16 },
  empty: { alignItems:"center", justifyContent:"center", paddingTop:60, gap:12 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
});

const LFM = StyleSheet.create({
  statsBanner: { flexDirection:"row", alignItems:"center", marginTop:12, marginBottom:10, backgroundColor:"#F9FAFB", borderRadius:18, padding:12, borderWidth:1, borderColor:"#F3F4F6" },
  statCard: { flex:1, alignItems:"center", gap:4, paddingVertical:4, borderRadius:12 },
  statCardActive: { backgroundColor:"#EFF6FF" },
  statIconWrap: { width:32, height:32, borderRadius:16, backgroundColor:"#fff", alignItems:"center", justifyContent:"center", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:3, elevation:1 },
  statNum: { fontSize:18, fontWeight:"900", color:"#111827" },
  statLbl: { fontSize:10, color:"#9CA3AF", fontWeight:"500" },
  statDivider: { width:1, height:40, backgroundColor:"#E5E7EB" },
  filterRow: { flexDirection:"row", gap:8, marginBottom:4 },
  filterPill: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:"#F9FAFB", borderWidth:1, borderColor:"#E5E7EB" },
  filterPillLost:  { backgroundColor:"#FEF2F2", borderColor:"#FECACA" },
  filterPillFound: { backgroundColor:"#F0FDF4", borderColor:"#BBF7D0" },
  filterPillAll:   { backgroundColor:"#EFF6FF", borderColor:"#BFDBFE" },
  filterPillTxt: { fontSize:12, fontWeight:"600", color:"#9CA3AF" },
  infoNote: { flexDirection:"row", gap:8, backgroundColor:"#EFF6FF", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BFDBFE", marginBottom:12 },
  infoNoteTxt: { flex:1, fontSize:12, color:"#3B82F6", lineHeight:18 },
});
