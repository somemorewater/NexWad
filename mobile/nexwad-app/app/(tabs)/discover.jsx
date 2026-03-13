// app/(tabs)/discover.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Dimensions, Platform, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

const CATEGORIES = [
  { id:"1", label:"Textbooks",   icon:"book-outline",       bg:"#DBEAFE", iconColor:"#1E3A8A", route:"/(tabs)/marketplace?category=Textbooks"   },
  { id:"2", label:"Electronics", icon:"flash-outline",      bg:"#FEF9C3", iconColor:"#854D0E", route:"/(tabs)/marketplace?category=Electronics" },
  { id:"3", label:"Food",        icon:"restaurant-outline", bg:"#FCE7F3", iconColor:"#9D174D", route:"/(tabs)/marketplace?category=Food"        },
  { id:"4", label:"Services",    icon:"briefcase-outline",  bg:"#EDE9FE", iconColor:"#4C1D95", route:"/(tabs)/marketplace?category=Services"    },
  { id:"5", label:"Fashion",     icon:"shirt-outline",      bg:"#DCFCE7", iconColor:"#15803D", route:"/(tabs)/marketplace?category=Fashion"     },
  { id:"6", label:"Housing",     icon:"home-outline",       bg:"#FFF7ED", iconColor:"#EA580C", route:"/(tabs)/marketplace?category=Housing"     },
  { id:"7", label:"Stationery",  icon:"pencil-outline",     bg:"#F0F9FF", iconColor:"#0369A1", route:"/(tabs)/marketplace?category=Stationery"  },
  { id:"8", label:"More",        icon:"grid-outline",       bg:"#F3F4F6", iconColor:"#374151", route:"/(tabs)/marketplace"                      },
];

const RECENT_SEARCHES = ["Maths textbook", "Laptop charger", "Jollof rice", "Casio calculator"];

const TABS = [
  { key:"home",        iconFill:"home",      iconLine:"home-outline",       label:"Home",     route:"/(tabs)/feed"        },
  { key:"discover",    iconFill:"compass",   iconLine:"compass-outline",    label:"Discover", route:"/(tabs)/discover"    },
  { key:"marketplace", iconFill:"storefront",iconLine:"storefront-outline", label:"Market",   route:"/(tabs)/marketplace" },
  { key:"profile",     iconFill:"person",    iconLine:"person-outline",     label:"Profile",  route:"/(tabs)/profile"     },
];

const BottomNav = ({ active }) => (
  <View style={N.bar}>
    {TABS.map(tab => {
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
  btn:  { width:52, height:52, borderRadius:26, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.32, shadowRadius:14, elevation:12 },
});

const ProductCard = ({ item, index }) => {
  const [saved, setSaved] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:380, delay:index*60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:380, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    setSaved(v => !v);
    try { await api.saved.listings.toggle(item.id); } catch {}
  };

  const handleAddToCart = async () => {
    try {
      await api.cart.add(item.id);
      router.push("/(tabs)/cart");
    } catch { router.push("/(tabs)/cart"); }
  };

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:CARD_W }}>
      <TouchableOpacity style={PC.card} activeOpacity={0.93} onPress={() => router.push(`/(tabs)/listing/${item.id}`)}>
        <View style={[PC.imgWrap, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="pricetag-outline" size={40} color="#1E3A8A" style={{ opacity:0.3 }} />
          <TouchableOpacity style={PC.saveBtn} onPress={handleSave}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={16} color={saved ? "#1E3A8A" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
        <View style={PC.info}>
          <View style={[PC.tag, { backgroundColor:"#DBEAFE" }]}>
            <Text style={[PC.tagTxt, { color:"#1E3A8A" }]}>{item.category || "Item"}</Text>
          </View>
          <Text style={PC.title} numberOfLines={2}>{item.title}</Text>
          <Text style={PC.seller}>by {item.seller?.name || "Seller"}</Text>
          <View style={PC.footer}>
            <Text style={PC.price}>₦{Number(item.price||0).toLocaleString()}</Text>
            <TouchableOpacity style={PC.addBtn} onPress={handleAddToCart}>
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PC = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, marginBottom:16 },
  imgWrap: { height:110, alignItems:"center", justifyContent:"center", position:"relative" },
  saveBtn: { position:"absolute", top:8, right:8, width:28, height:28, borderRadius:14, backgroundColor:"rgba(255,255,255,0.9)", alignItems:"center", justifyContent:"center" },
  info: { padding:10 },
  tag: { alignSelf:"flex-start", paddingHorizontal:7, paddingVertical:2, borderRadius:10, marginBottom:5 },
  tagTxt: { fontSize:9, fontWeight:"700", letterSpacing:0.3 },
  title: { fontSize:13, fontWeight:"700", color:"#111827", lineHeight:18, marginBottom:3 },
  seller: { fontSize:11, color:"#9CA3AF", marginBottom:8 },
  footer: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  price: { fontSize:14, fontWeight:"800", color:"#1E3A8A" },
  addBtn: { width:28, height:28, borderRadius:14, backgroundColor:"#F97316", alignItems:"center", justifyContent:"center" },
});

const SearchOverlay = ({ visible, onClose }) => {
  const [query, setQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue:1, duration:200, useNativeDriver:true }).start();
      setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      Animated.timing(fadeAnim, { toValue:0, duration:160, useNativeDriver:true }).start();
      setQuery("");
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[SO.overlay, { opacity:fadeAnim }]}>
      <SafeAreaView style={{ flex:1 }}>
        <View style={SO.bar}>
          <View style={SO.inputWrap}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight:8 }} />
            <TextInput
              ref={inputRef}
              style={SO.input}
              placeholder="Search Nexwad..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => { onClose(); router.push(`/(tabs)/search?q=${query}`); }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={SO.cancelBtn}>
            <Text style={SO.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex:1 }} keyboardShouldPersistTaps="handled">
          <View style={SO.section}>
            <Text style={SO.sectionTitle}>Recent Searches</Text>
            {RECENT_SEARCHES.map(s => (
              <TouchableOpacity key={s} style={SO.recentRow} onPress={() => { onClose(); router.push(`/(tabs)/search?q=${s}`); }}>
                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                <Text style={SO.recentTxt}>{s}</Text>
                <Ionicons name="arrow-up-outline" size={14} color="#D1D5DB" style={{ transform:[{rotate:"45deg"}] }} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
};

const SO = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:"#fff", zIndex:200 },
  bar: { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:10, gap:10, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  inputWrap: { flex:1, flexDirection:"row", alignItems:"center", backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:44 },
  input: { flex:1, fontSize:15, color:"#111827" },
  cancelBtn: { paddingHorizontal:4 },
  cancelTxt: { fontSize:14, fontWeight:"600", color:"#F97316" },
  section: { paddingHorizontal:16, paddingTop:20 },
  sectionTitle: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  recentRow: { flexDirection:"row", alignItems:"center", gap:12, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  recentTxt: { flex:1, fontSize:14, color:"#374151", fontWeight:"500" },
});

const CategoryItem = ({ cat, index }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:350, delay:index*50, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity:anim, flex:1, minWidth:"22%", maxWidth:"25%", alignItems:"center" }}>
      <TouchableOpacity style={D.catItem} onPress={() => router.push(cat.route)} activeOpacity={0.8}>
        <View style={[D.catIcon, { backgroundColor:cat.bg }]}>
          <Ionicons name={cat.icon} size={22} color={cat.iconColor} />
        </View>
        <Text style={D.catLabel}>{cat.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Discover() {
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [listings,    setListings]    = useState([]);
  const [sellers,     setSellers]     = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);

  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  const load = useCallback(async () => {
    try {
      const [lstRes, selRes] = await Promise.all([
        api.listings.list({ page:1, limit:8, sort:"new" }),
        api.sellers.list({ limit:5 }),
      ]);
      setListings(lstRes.listings || []);
      setSellers(selRes.sellers  || []);
    } catch (err) {
      console.log("[discover error]", err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(headerFade,  { toValue:1, duration:500, useNativeDriver:true }),
      Animated.timing(headerSlide, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start();
  }, []);

  // Pair listings into rows of 2
  const productRows = [];
  for (let i = 0; i < listings.length; i += 2) productRows.push(listings.slice(i, i+2));

  return (
    <SafeAreaView style={D.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={D.header}>
        <View>
          <Text style={D.headerSup}>AFIT Campus</Text>
          <Text style={D.headerTitle}>Discover</Text>
        </View>
        <View style={D.headerRight}>
          <TouchableOpacity style={D.hBtn} onPress={() => setSearchOpen(true)}>
            <Ionicons name="search-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={D.hBtn} onPress={() => router.push("/(tabs)/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            <View style={D.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#F97316"]} />}
      >
        <Animated.View style={[D.heroWrap, { opacity:headerFade, transform:[{translateY:headerSlide}] }]}>
          <TouchableOpacity style={D.heroSearch} onPress={() => setSearchOpen(true)} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <Text style={D.heroSearchTxt}>Search listings, sellers, tags…</Text>
            <View style={D.heroSearchBadge}>
              <Ionicons name="options-outline" size={14} color="#1E3A8A" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Categories */}
        <View style={D.section}>
          <View style={D.sectionHead}>
            <Text style={D.sectionTitle}>Browse Categories</Text>
          </View>
          <View style={D.catGrid}>
            {CATEGORIES.map((cat, i) => <CategoryItem key={cat.id} cat={cat} index={i} />)}
          </View>
        </View>

        {/* Top Sellers */}
        {sellers.length > 0 && (
          <View style={D.section}>
            <View style={D.sectionHead}>
              <Text style={D.sectionTitle}>Top Sellers</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/sellers")}>
                <Text style={D.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft:16, gap:12, paddingRight:16 }}>
              {sellers.map(seller => {
                const initials = (seller.name||"S").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase();
                return (
                  <TouchableOpacity key={seller.id} style={D.sellerCard} onPress={() => router.push(`/(tabs)/seller/${seller.username||seller.id}`)} activeOpacity={0.88}>
                    <View style={[D.sellerAvatar, { backgroundColor:"#DCFCE7" }]}>
                      <Text style={[D.sellerInitials, { color:"#15803D" }]}>{initials}</Text>
                    </View>
                    {seller.rating != null && (
                      <View style={D.sellerBadge}>
                        <Ionicons name="star" size={9} color="#F59E0B" />
                        <Text style={D.sellerRating}>{Number(seller.rating).toFixed(1)}</Text>
                      </View>
                    )}
                    <Text style={D.sellerName}>{seller.name}</Text>
                    <Text style={D.sellerDept}>{seller.dept || ""}</Text>
                    {seller.totalSales != null && <Text style={D.sellerSales}>{seller.totalSales} sales</Text>}
                    <TouchableOpacity style={D.followBtn} onPress={() => router.push(`/(tabs)/seller/${seller.username||seller.id}`)}>
                      <Text style={D.followBtnTxt}>View</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Just Listed */}
        {listings.length > 0 && (
          <View style={D.section}>
            <View style={D.sectionHead}>
              <Text style={D.sectionTitle}>Just Listed</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/marketplace")}>
                <Text style={D.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={D.productGrid}>
              {productRows.map((row, ri) => (
                <View key={ri} style={D.productRow}>
                  {row.map((item, ci) => <ProductCard key={item.id} item={item} index={ri*2+ci} />)}
                  {row.length === 1 && <View style={{ width:CARD_W }} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Become a Seller */}
        <TouchableOpacity style={D.sellerBanner} onPress={() => router.push("/(tabs)/become-seller")} activeOpacity={0.88}>
          <View style={D.sellerBannerLeft}>
            <View style={D.sellerBannerIconWrap}>
              <Ionicons name="storefront-outline" size={26} color="#1E3A8A" />
            </View>
            <View>
              <Text style={D.sellerBannerTitle}>Become a Seller</Text>
              <Text style={D.sellerBannerSub}>List your first item in 2 minutes</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#1E3A8A" />
        </TouchableOpacity>
      </ScrollView>

      <FloatingCart />
      <BottomNav active="discover" />
      <SearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </SafeAreaView>
  );
}

const D = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerSup: { fontSize:11, fontWeight:"700", color:"#F97316", letterSpacing:1, textTransform:"uppercase" },
  headerTitle: { fontSize:26, fontWeight:"900", color:"#111827", letterSpacing:-0.5, marginTop:1 },
  headerRight: { flexDirection:"row", gap:4 },
  hBtn: { padding:6, position:"relative" },
  notifDot: { position:"absolute", top:6, right:6, width:7, height:7, borderRadius:4, backgroundColor:"#F97316", borderWidth:1.5, borderColor:"#fff" },
  heroWrap: { paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  heroSearch: { flexDirection:"row", alignItems:"center", backgroundColor:"#F9FAFB", borderRadius:16, paddingHorizontal:14, height:50, borderWidth:1.5, borderColor:"#E5E7EB", gap:10 },
  heroSearchTxt: { flex:1, fontSize:14, color:"#9CA3AF", fontWeight:"400" },
  heroSearchBadge: { width:30, height:30, borderRadius:10, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  section: { paddingTop:20 },
  sectionHead: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, marginBottom:14 },
  sectionTitle: { fontSize:17, fontWeight:"800", color:"#111827", letterSpacing:-0.3 },
  seeAll: { fontSize:13, fontWeight:"600", color:"#F97316" },
  catGrid: { flexDirection:"row", flexWrap:"wrap", paddingHorizontal:8 },
  catItem: { alignItems:"center", paddingVertical:6, paddingHorizontal:4 },
  catIcon: { width:54, height:54, borderRadius:18, alignItems:"center", justifyContent:"center", marginBottom:6 },
  catLabel: { fontSize:11, fontWeight:"600", color:"#374151", textAlign:"center" },
  sellerCard: { width:120, backgroundColor:"#fff", borderRadius:18, borderWidth:1, borderColor:"#F3F4F6", padding:12, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  sellerAvatar: { width:52, height:52, borderRadius:26, alignItems:"center", justifyContent:"center", marginBottom:6 },
  sellerInitials: { fontSize:16, fontWeight:"800" },
  sellerBadge: { position:"absolute", top:8, right:8, flexDirection:"row", alignItems:"center", gap:2, backgroundColor:"#FEF3C7", paddingHorizontal:5, paddingVertical:2, borderRadius:8 },
  sellerRating: { fontSize:9, fontWeight:"800", color:"#B45309" },
  sellerName: { fontSize:13, fontWeight:"700", color:"#111827", textAlign:"center" },
  sellerDept: { fontSize:10, color:"#9CA3AF", marginTop:1, textAlign:"center" },
  sellerSales: { fontSize:11, fontWeight:"600", color:"#374151", marginTop:4 },
  followBtn: { marginTop:8, backgroundColor:"#EFF6FF", paddingHorizontal:16, paddingVertical:5, borderRadius:12 },
  followBtnTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  productGrid: { paddingHorizontal:16 },
  productRow: { flexDirection:"row", gap:16, marginBottom:0 },
  sellerBanner: { marginHorizontal:16, marginTop:20, borderRadius:20, backgroundColor:"#EFF6FF", borderWidth:1.5, borderColor:"#BFDBFE", padding:18, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  sellerBannerLeft: { flexDirection:"row", alignItems:"center", gap:14 },
  sellerBannerIconWrap: { width:50, height:50, borderRadius:25, backgroundColor:"#DBEAFE", alignItems:"center", justifyContent:"center" },
  sellerBannerTitle: { fontSize:15, fontWeight:"800", color:"#1E3A8A" },
  sellerBannerSub: { fontSize:12, color:"#3B82F6", marginTop:2 },
});
