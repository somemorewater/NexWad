// app/search.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput, Dimensions, Platform, Modal, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

const ALL = [
  { id:"p1",  title:"Stroud Maths 7th Ed",        price:4500,  tag:"Textbooks",   tagBg:"#DBEAFE", tagColor:"#1E3A8A", imgBg:"#DBEAFE", imgIcon:"book-outline",        imgColor:"#1E3A8A", seller:"Ada O."    },
  { id:"p2",  title:"HP 65W USB-C Charger",        price:6000,  tag:"Electronics", tagBg:"#FEF9C3", tagColor:"#854D0E", imgBg:"#FEF9C3", imgIcon:"flash-outline",       imgColor:"#854D0E", seller:"Emeka B."  },
  { id:"p3",  title:"Jollof Rice + Protein",       price:800,   tag:"Food",        tagBg:"#FCE7F3", tagColor:"#9D174D", imgBg:"#FEF3C7", imgIcon:"restaurant-outline",  imgColor:"#B45309", seller:"Fatima Y." },
  { id:"p4",  title:"AutoCAD Tutoring",            price:3000,  tag:"Services",    tagBg:"#EDE9FE", tagColor:"#4C1D95", imgBg:"#EDE9FE", imgIcon:"desktop-outline",     imgColor:"#4C1D95", seller:"Chuks E."  },
  { id:"p5",  title:"Casio fx-991EX Calc",         price:5500,  tag:"Electronics", tagBg:"#FEF9C3", tagColor:"#854D0E", imgBg:"#F0F9FF", imgIcon:"calculator-outline",  imgColor:"#0369A1", seller:"Ngozi A."  },
  { id:"p6",  title:"Second-hand Polo Set",        price:2200,  tag:"Fashion",     tagBg:"#DCFCE7", tagColor:"#15803D", imgBg:"#DCFCE7", imgIcon:"shirt-outline",       imgColor:"#15803D", seller:"Ada O."    },
  { id:"p7",  title:"Room for Sublet",             price:18000, tag:"Housing",     tagBg:"#FFF7ED", tagColor:"#EA580C", imgBg:"#FFF7ED", imgIcon:"home-outline",        imgColor:"#EA580C", seller:"Emeka B."  },
  { id:"p8",  title:"Engineering Drawing Set",     price:3800,  tag:"Stationery",  tagBg:"#F0F9FF", tagColor:"#0369A1", imgBg:"#F0F9FF", imgIcon:"pencil-outline",      imgColor:"#0369A1", seller:"Chuks E."  },
  { id:"p9",  title:"Python Tutoring (1hr)",       price:2500,  tag:"Services",    tagBg:"#EDE9FE", tagColor:"#4C1D95", imgBg:"#EDE9FE", imgIcon:"code-slash-outline",  imgColor:"#4C1D95", seller:"Ada O."    },
  { id:"p10", title:"Mechanics of Materials",      price:3200,  tag:"Textbooks",   tagBg:"#DBEAFE", tagColor:"#1E3A8A", imgBg:"#DBEAFE", imgIcon:"book-outline",        imgColor:"#1E3A8A", seller:"Ngozi A."  },
];

const CATEGORIES = ["All","Textbooks","Electronics","Food","Services","Fashion","Housing","Stationery"];
const SORT_OPTIONS = [
  { id:"relevant", label:"Most Relevant"  },
  { id:"newest",   label:"Newest First"   },
  { id:"low",      label:"Price: Low–High"},
  { id:"high",     label:"Price: High–Low"},
];
const PRICE_PRESETS = [
  { label:"Any",         min:0,     max:Infinity },
  { label:"Under ₦1k",  min:0,     max:1000     },
  { label:"₦1k–₦5k",   min:1000,  max:5000     },
  { label:"₦5k–₦20k",  min:5000,  max:20000    },
  { label:"₦20k+",      min:20000, max:Infinity },
];

const RECENT  = ["Maths textbook","Laptop charger","Jollof rice","Casio calculator"];

const fmt = (n) => n === Infinity ? "" : `₦${n.toLocaleString()}`;

const ResultCard = ({ item, index }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(12)).current;
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:300, delay:index*40, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:300, delay:index*40, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{opacity:fa, transform:[{translateY:sa}], width:CARD_W}}>
      <TouchableOpacity style={s.resultCard} onPress={() => router.push(`/listing/${item.id}`)} activeOpacity={0.92}>
        <View style={[s.resultImg, {backgroundColor:item.imgBg}]}>
          <Ionicons name={item.imgIcon} size={32} color={item.imgColor} style={{opacity:0.35}} />
        </View>
        <View style={s.resultInfo}>
          <View style={[s.resultTag, {backgroundColor:item.tagBg}]}>
            <Text style={[s.resultTagTxt, {color:item.tagColor}]}>{item.tag}</Text>
          </View>
          <Text style={s.resultTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={s.resultSeller}>by {item.seller}</Text>
          <View style={s.resultFooter}>
            <Text style={s.resultPrice}>₦{item.price.toLocaleString()}</Text>
            <View style={{ flexDirection:"row", gap:6, alignItems:"center" }}>
              <TouchableOpacity onPress={() => setSaved(v => !v)} hitSlop={{top:6,bottom:6,left:6,right:6}}>
                <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={16} color={saved ? "#1E3A8A" : "#9CA3AF"} />
              </TouchableOpacity>
              <TouchableOpacity style={s.addBtn} onPress={() => router.push("/cart")}>
                <Ionicons name="add" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Search() {
  const { q } = useLocalSearchParams();
  const [query,        setQuery]        = useState(q || "");
  const [showFilters,  setShowFilters]  = useState(false);
  const [category,     setCategory]     = useState("All");
  const [pricePreset,  setPricePreset]  = useState(0); // index into PRICE_PRESETS
  const [sortBy,       setSortBy]       = useState("relevant");
  // temp state inside the sheet (committed on Apply)
  const [tmpCat,       setTmpCat]       = useState("All");
  const [tmpPrice,     setTmpPrice]     = useState(0);
  const [tmpSort,      setTmpSort]      = useState("relevant");

  const inputRef = useRef(null);

  const openFilters = () => {
    setTmpCat(category); setTmpPrice(pricePreset); setTmpSort(sortBy);
    setShowFilters(true);
  };
  const applyFilters = () => {
    setCategory(tmpCat); setPricePreset(tmpPrice); setSortBy(tmpSort);
    setShowFilters(false);
  };
  const resetFilters = () => {
    setTmpCat("All"); setTmpPrice(0); setTmpSort("relevant");
  };

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const activeFilterCount = (category !== "All" ? 1 : 0) + (pricePreset !== 0 ? 1 : 0) + (sortBy !== "relevant" ? 1 : 0);

  const results = useMemo(() => {
    const preset = PRICE_PRESETS[pricePreset];
    let out = query.trim()
      ? ALL.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.tag.toLowerCase().includes(query.toLowerCase()) ||
          p.seller.toLowerCase().includes(query.toLowerCase()))
      : [...ALL];

    if (category !== "All") out = out.filter(p => p.tag === category);
    out = out.filter(p => p.price >= preset.min && p.price <= preset.max);

    if (sortBy === "low")    out.sort((a,b) => a.price - b.price);
    if (sortBy === "high")   out.sort((a,b) => b.price - a.price);
    if (sortBy === "newest") out.sort((a,b) => b.id.localeCompare(a.id));

    return out;
  }, [query, category, pricePreset, sortBy]);

  const rows = [];
  for (let i = 0; i < results.length; i += 2) rows.push(results.slice(i, i+2));

  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = category !== "All" || pricePreset !== 0;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Search bar row */}
      <View style={s.header}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Search listings, sellers…"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={17} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={s.cancelBtn}>
          <Text style={s.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Filter / sort bar — shown whenever there's a query or active filters */}
      {(hasQuery || hasActiveFilters) && (
        <View style={s.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
            {/* Filter button */}
            <TouchableOpacity style={[s.filterChip, activeFilterCount > 0 && s.filterChipActive]} onPress={openFilters}>
              <Ionicons name="options-outline" size={14} color={activeFilterCount > 0 ? "#fff" : "#374151"} />
              <Text style={[s.filterChipTxt, activeFilterCount > 0 && { color:"#fff" }]}>
                Filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
              </Text>
            </TouchableOpacity>
            {/* Sort chip */}
            <TouchableOpacity style={[s.filterChip, sortBy !== "relevant" && s.filterChipActive]} onPress={openFilters}>
              <Ionicons name="swap-vertical-outline" size={14} color={sortBy !== "relevant" ? "#fff" : "#374151"} />
              <Text style={[s.filterChipTxt, sortBy !== "relevant" && { color:"#fff" }]}>
                {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
              </Text>
            </TouchableOpacity>
            {/* Category quick chips */}
            {CATEGORIES.filter(c => c !== "All").map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.filterChip, category === cat && s.filterChipActive]}
                onPress={() => setCategory(prev => prev === cat ? "All" : cat)}
              >
                <Text style={[s.filterChipTxt, category === cat && { color:"#fff" }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {!hasQuery && !hasActiveFilters ? (
        /* Empty state — recent searches */
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent</Text>
              {RECENT.map(r => (
                <TouchableOpacity key={r} style={s.recentRow} onPress={() => setQuery(r)}>
                  <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                  <Text style={s.recentTxt}>{r}</Text>
                  <Ionicons name="arrow-up-outline" size={13} color="#D1D5DB" style={{transform:[{rotate:"45deg"}]}} />
                </TouchableOpacity>
              ))}
            </View>
          }
          renderItem={null}
          showsVerticalScrollIndicator={false}
        />
      ) : results.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={44} color="#D1D5DB" />
          <Text style={s.emptyTitle}>No results found</Text>
          <Text style={s.emptySub}>
            {hasActiveFilters
              ? "Try adjusting your filters or clearing them"
              : `Nothing matched "${query}"`}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity style={s.browseBtn} onPress={() => { setCategory("All"); setPricePreset(0); setSortBy("relevant"); }}>
              <Text style={s.browseBtnTxt}>Clear Filters</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.browseBtn, { backgroundColor:"#F3F4F6", marginTop:6 }]} onPress={() => router.push("/(tabs)/marketplace")}>
            <Text style={[s.browseBtnTxt, { color:"#374151" }]}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View style={s.resultsWrap}>
              <Text style={s.resultsCount}>
                <Text style={{fontWeight:"800", color:"#111827"}}>{results.length}</Text>
                {hasQuery ? ` results for "${query}"` : " listings"}
                {activeFilterCount > 0 ? " · filtered" : ""}
              </Text>
              {rows.map((row, ri) => (
                <View key={ri} style={s.gridRow}>
                  {row.map((item, ci) => <ResultCard key={item.id} item={item} index={ri*2+ci} />)}
                  {row.length === 1 && <View style={{width:CARD_W}} />}
                </View>
              ))}
            </View>
          }
          renderItem={null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom:40}}
        />
      )}

      {/* Filter bottom sheet */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowFilters(false)} />
        <View style={s.sheet}>
          {/* Sheet header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={s.resetTxt}>Reset all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
            {/* Sort */}
            <Text style={s.sheetSection}>Sort by</Text>
            <View style={s.chipRow}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.sheetChip, tmpSort === opt.id && s.sheetChipActive]}
                  onPress={() => setTmpSort(opt.id)}
                >
                  <Text style={[s.sheetChipTxt, tmpSort === opt.id && s.sheetChipTxtActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={s.sheetSection}>Category</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.sheetChip, tmpCat === cat && s.sheetChipActive]}
                  onPress={() => setTmpCat(cat)}
                >
                  <Text style={[s.sheetChipTxt, tmpCat === cat && s.sheetChipTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price range */}
            <Text style={s.sheetSection}>Price range</Text>
            <View style={s.chipRow}>
              {PRICE_PRESETS.map((p, i) => (
                <TouchableOpacity
                  key={p.label}
                  style={[s.sheetChip, tmpPrice === i && s.sheetChipActive]}
                  onPress={() => setTmpPrice(i)}
                >
                  <Text style={[s.sheetChipTxt, tmpPrice === i && s.sheetChipTxtActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply */}
          <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
            <Text style={s.applyBtnTxt}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:10, gap:10, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  searchBar: { flex:1, flexDirection:"row", alignItems:"center", backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:44, gap:8 },
  input: { flex:1, fontSize:15, color:"#111827" },
  cancelBtn: { paddingHorizontal:4 },
  cancelTxt: { fontSize:14, fontWeight:"600", color:"#F97316" },

  filterBar: { borderBottomWidth:1, borderBottomColor:"#F3F4F6", paddingVertical:8 },
  filterScroll: { paddingHorizontal:16, gap:8 },
  filterChip: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:"#F3F4F6", borderWidth:1, borderColor:"#E5E7EB" },
  filterChipActive: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  filterChipTxt: { fontSize:12, fontWeight:"600", color:"#374151" },

  section: { paddingHorizontal:16, paddingTop:20 },
  sectionTitle: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  recentRow: { flexDirection:"row", alignItems:"center", gap:12, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  recentTxt: { flex:1, fontSize:14, color:"#374151", fontWeight:"500" },

  empty: { flex:1, alignItems:"center", justifyContent:"center", gap:10, paddingHorizontal:40 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
  browseBtn: { marginTop:4, backgroundColor:"#1E3A8A", paddingHorizontal:22, paddingVertical:12, borderRadius:16 },
  browseBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },

  resultsWrap: { paddingHorizontal:16, paddingTop:14 },
  resultsCount: { fontSize:13, color:"#6B7280", marginBottom:14 },
  gridRow: { flexDirection:"row", gap:16, marginBottom:0 },
  resultCard: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, marginBottom:16 },
  resultImg: { height:100, alignItems:"center", justifyContent:"center" },
  resultInfo: { padding:10 },
  resultTag: { alignSelf:"flex-start", paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginBottom:4 },
  resultTagTxt: { fontSize:9, fontWeight:"700" },
  resultTitle: { fontSize:12, fontWeight:"700", color:"#111827", lineHeight:17, marginBottom:3 },
  resultSeller: { fontSize:10, color:"#9CA3AF", marginBottom:7 },
  resultFooter: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  resultPrice: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  addBtn: { width:26, height:26, borderRadius:13, backgroundColor:"#F97316", alignItems:"center", justifyContent:"center" },

  backdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.35)" },
  sheet: { backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:Platform.OS==="ios"?36:24, maxHeight:"75%" },
  sheetHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:20 },
  sheetTitle: { fontSize:18, fontWeight:"900", color:"#111827" },
  resetTxt: { fontSize:13, fontWeight:"700", color:"#F97316" },
  sheetSection: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12, marginTop:8 },
  chipRow: { flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:8 },
  sheetChip: { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:"#F3F4F6", borderWidth:1.5, borderColor:"#E5E7EB" },
  sheetChipActive: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  sheetChipTxt: { fontSize:13, fontWeight:"600", color:"#374151" },
  sheetChipTxtActive: { color:"#fff" },
  applyBtn: { height:54, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginTop:16, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  applyBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
});


