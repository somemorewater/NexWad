// app/category/[id].jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput, Dimensions, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

const CATEGORY_META = {
  textbooks:   { label:"Textbooks",   icon:"book-outline",         bg:"#DBEAFE", color:"#1E3A8A", headerBg:"#1E3A8A" },
  electronics: { label:"Electronics", icon:"flash-outline",        bg:"#FEF9C3", color:"#854D0E", headerBg:"#854D0E" },
  food:        { label:"Food",        icon:"restaurant-outline",   bg:"#FCE7F3", color:"#9D174D", headerBg:"#9D174D" },
  services:    { label:"Services",    icon:"briefcase-outline",    bg:"#EDE9FE", color:"#4C1D95", headerBg:"#4C1D95" },
  fashion:     { label:"Fashion",     icon:"shirt-outline",        bg:"#DCFCE7", color:"#15803D", headerBg:"#15803D" },
  housing:     { label:"Housing",     icon:"home-outline",         bg:"#FFF7ED", color:"#EA580C", headerBg:"#EA580C" },
  stationery:  { label:"Stationery",  icon:"pencil-outline",       bg:"#F0F9FF", color:"#0369A1", headerBg:"#0369A1" },
  sports:      { label:"Sports",      icon:"football-outline",     bg:"#F0FDF4", color:"#15803D", headerBg:"#15803D" },
  beauty:      { label:"Beauty",      icon:"sparkles-outline",     bg:"#FDF4FF", color:"#7C3AED", headerBg:"#7C3AED" },
  tech:        { label:"Tech Help",   icon:"hardware-chip-outline",bg:"#EFF6FF", color:"#2563EB", headerBg:"#2563EB" },
};

const ALL_PRODUCTS = [
  { id:"p1",  cat:"textbooks",   title:"Stroud Engineering Maths 7th Ed",  price:"₦4,500",  imgIcon:"book-outline",        imgColor:"#1E3A8A", imgBg:"#DBEAFE", seller:"Ada O.",    rating:4.9, reviews:12, badge:"Popular" },
  { id:"p10", cat:"textbooks",   title:"Mechanics of Materials",            price:"₦3,200",  imgIcon:"book-outline",        imgColor:"#1E3A8A", imgBg:"#DBEAFE", seller:"Ngozi A.", rating:4.7, reviews:5,  badge:null      },
  { id:"p13", cat:"textbooks",   title:"Engineering Mathematics Vol. 2",    price:"₦2,800",  imgIcon:"book-outline",        imgColor:"#1E3A8A", imgBg:"#DBEAFE", seller:"Emeka B.", rating:4.5, reviews:3,  badge:"New"     },
  { id:"p14", cat:"textbooks",   title:"Fluid Mechanics — Munson",          price:"₦3,500",  imgIcon:"book-outline",        imgColor:"#1E3A8A", imgBg:"#DBEAFE", seller:"Ada O.",    rating:4.6, reviews:7,  badge:null      },
  { id:"p2",  cat:"electronics", title:"HP 65W USB-C Laptop Charger",       price:"₦6,000",  imgIcon:"flash-outline",       imgColor:"#854D0E", imgBg:"#FEF9C3", seller:"Emeka B.", rating:4.8, reviews:7,  badge:null      },
  { id:"p5",  cat:"electronics", title:"Casio fx-991EX Calculator",         price:"₦5,500",  imgIcon:"calculator-outline",  imgColor:"#0369A1", imgBg:"#F0F9FF", seller:"Ngozi A.", rating:4.9, reviews:4,  badge:null      },
  { id:"p11", cat:"electronics", title:"JBL Tune 120 Earbuds",              price:"₦9,500",  imgIcon:"headset-outline",     imgColor:"#854D0E", imgBg:"#FEF9C3", seller:"Emeka B.", rating:4.9, reviews:22, badge:"Popular" },
  { id:"p15", cat:"electronics", title:"USB Hub 7-Port",                    price:"₦4,200",  imgIcon:"hardware-chip-outline",imgColor:"#0369A1",imgBg:"#F0F9FF", seller:"Chuks E.", rating:4.4, reviews:2,  badge:"New"     },
  { id:"p3",  cat:"food",        title:"Jollof Rice + Protein (Daily)",     price:"₦800",    imgIcon:"restaurant-outline",  imgColor:"#B45309", imgBg:"#FEF3C7", seller:"Fatima Y.",rating:5.0, reviews:34, badge:"Hot"     },
  { id:"p12", cat:"food",        title:"Shawarma (Chicken / Beef)",         price:"₦1,200",  imgIcon:"fast-food-outline",   imgColor:"#9D174D", imgBg:"#FCE7F3", seller:"Fatima Y.",rating:4.9, reviews:41, badge:"Hot"     },
  { id:"p16", cat:"food",        title:"Indomie + Egg (Breakfast)",         price:"₦500",    imgIcon:"restaurant-outline",  imgColor:"#B45309", imgBg:"#FEF3C7", seller:"Ada O.",    rating:4.8, reviews:14, badge:null      },
  { id:"p4",  cat:"services",    title:"AutoCAD & SolidWorks Tutoring",     price:"₦3,000",  imgIcon:"desktop-outline",     imgColor:"#4C1D95", imgBg:"#EDE9FE", seller:"Chuks E.", rating:4.7, reviews:11, badge:null      },
  { id:"p9",  cat:"services",    title:"Python Programming Tutoring",       price:"₦2,500",  imgIcon:"code-slash-outline",  imgColor:"#4C1D95", imgBg:"#EDE9FE", seller:"Ada O.",    rating:5.0, reviews:18, badge:"Top Rated"},
  { id:"p17", cat:"services",    title:"Laundry Service (Weekly)",          price:"₦1,500",  imgIcon:"shirt-outline",       imgColor:"#15803D", imgBg:"#DCFCE7", seller:"Ngozi A.", rating:4.6, reviews:9,  badge:null      },
  { id:"p6",  cat:"fashion",     title:"Second-hand Polo Set (3 pcs)",      price:"₦2,200",  imgIcon:"shirt-outline",       imgColor:"#15803D", imgBg:"#DCFCE7", seller:"Ada O.",    rating:4.6, reviews:6,  badge:"New"     },
  { id:"p18", cat:"fashion",     title:"Nike Sneakers (UK 9)",              price:"₦12,000", imgIcon:"footsteps-outline",   imgColor:"#15803D", imgBg:"#DCFCE7", seller:"Emeka B.", rating:4.7, reviews:3,  badge:null      },
  { id:"p7",  cat:"housing",     title:"Off-campus Room for Sublet",        price:"₦18,000", imgIcon:"home-outline",        imgColor:"#EA580C", imgBg:"#FFF7ED", seller:"Emeka B.", rating:4.8, reviews:3,  badge:null      },
  { id:"p19", cat:"housing",     title:"Hostel Bedframe + Mattress",        price:"₦8,500",  imgIcon:"bed-outline",         imgColor:"#EA580C", imgBg:"#FFF7ED", seller:"Chuks E.", rating:4.5, reviews:2,  badge:null      },
  { id:"p8",  cat:"stationery",  title:"Engineering Drawing Set",           price:"₦3,800",  imgIcon:"pencil-outline",      imgColor:"#0369A1", imgBg:"#F0F9FF", seller:"Chuks E.", rating:4.5, reviews:8,  badge:null      },
  { id:"p20", cat:"stationery",  title:"A3 Drawing Board + T-Square",       price:"₦5,200",  imgIcon:"pencil-outline",      imgColor:"#0369A1", imgBg:"#F0F9FF", seller:"Ngozi A.", rating:4.8, reviews:4,  badge:"New"     },
];

const SORT_OPTIONS = [
  { id:"newest",     label:"Newest"       },
  { id:"price_asc",  label:"Lowest Price" },
  { id:"price_desc", label:"Highest Price"},
  { id:"popular",    label:"Most Popular" },
];

const Stars = ({ rating }) => (
  <View style={{ flexDirection:"row", gap:1 }}>
    {Array.from({length:5}).map((_,i) => (
      <Ionicons key={i} name={i<Math.floor(rating)?"star":i===Math.floor(rating)&&rating%1>=0.5?"star-half":"star-outline"} size={10} color={i<Math.ceil(rating)?"#F59E0B":"#D1D5DB"} />
    ))}
  </View>
);

const ProductCard = ({ item, meta, index }) => {
  const [saved, setSaved] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:340, delay:index*55, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:340, delay:index*55, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:CARD_W }}>
      <TouchableOpacity style={s.card} activeOpacity={0.92} onPress={() => router.push(`/listing/${item.id}`)}>
        <View style={[s.cardImg, { backgroundColor:item.imgBg }]}>
          <Ionicons name={item.imgIcon} size={36} color={item.imgColor} style={{ opacity:0.28 }} />
          {item.badge && (
            <View style={[s.badge,
              item.badge==="Hot"       && { backgroundColor:"#FEF2F2" },
              item.badge==="New"       && { backgroundColor:"#F0FDF4" },
              item.badge==="Top Rated" && { backgroundColor:"#EDE9FE" },
              item.badge==="Popular"   && { backgroundColor:"#FFF7ED" },
            ]}>
              <Text style={[s.badgeTxt,
                item.badge==="Hot"       && { color:"#DC2626" },
                item.badge==="New"       && { color:"#15803D" },
                item.badge==="Top Rated" && { color:"#4C1D95" },
                item.badge==="Popular"   && { color:"#EA580C" },
              ]}>{item.badge}</Text>
            </View>
          )}
          <TouchableOpacity style={s.saveBtn} onPress={() => setSaved(v=>!v)}>
            <Ionicons name={saved?"bookmark":"bookmark-outline"} size={14} color={saved?meta.color:"#9CA3AF"} />
          </TouchableOpacity>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:3, marginBottom:2 }}>
            <Stars rating={item.rating} />
            <Text style={s.reviewCnt}>({item.reviews})</Text>
          </View>
          <Text style={s.cardSeller}>by {item.seller}</Text>
          <View style={s.cardFooter}>
            <Text style={[s.cardPrice, { color:meta.color }]}>{item.price}</Text>
            <TouchableOpacity style={[s.addBtn, { backgroundColor:meta.color }]} onPress={() => router.push("/cart")}>
              <Ionicons name="add" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CategoryPage() {
  const { id } = useLocalSearchParams();
  const meta = CATEGORY_META[id] || CATEGORY_META["textbooks"];
  const [query,  setQuery]  = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade,  { toValue:1, duration:480, useNativeDriver:true }),
      Animated.timing(headerSlide, { toValue:0, duration:480, useNativeDriver:true }),
    ]).start();
  }, []);

  const products = useCallback(() => {
    let list = ALL_PRODUCTS.filter(p => p.cat === id);
    if (query.trim()) list = list.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
    if (sortBy === "price_asc")  list.sort((a,b) => parseInt(a.price.replace(/[^\d]/g,"")) - parseInt(b.price.replace(/[^\d]/g,"")));
    if (sortBy === "price_desc") list.sort((a,b) => parseInt(b.price.replace(/[^\d]/g,"")) - parseInt(a.price.replace(/[^\d]/g,"")));
    if (sortBy === "popular")    list.sort((a,b) => b.reviews - a.reviews);
    return list;
  }, [id, query, sortBy])();

  const rows = [];
  for (let i = 0; i < products.length; i += 2) rows.push(products.slice(i, i+2));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={meta.headerBg} />

      {/* Coloured header */}
      <Animated.View style={[s.header, { backgroundColor:meta.headerBg, opacity:headerFade, transform:[{translateY:headerSlide}] }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIconWrap, { backgroundColor:"rgba(255,255,255,0.2)" }]}>
            <Ionicons name={meta.icon} size={18} color="#fff" />
          </View>
          <Text style={s.headerTitle}>{meta.label}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/search")}>
          <Ionicons name="search-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Search bar */}
      <View style={[s.searchWrap, { borderColor:meta.bg }]}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={s.searchInput}
            placeholder={`Search ${meta.label.toLowerCase()}…`}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.sortBtn, { backgroundColor:meta.bg }]}
          onPress={() => setSortOpen(v => !v)}
        >
          <Ionicons name="swap-vertical-outline" size={17} color={meta.color} />
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {sortOpen && (
        <View style={s.sortDropdown}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[s.sortOption, sortBy===opt.id && { backgroundColor:meta.bg }]}
              onPress={() => { setSortBy(opt.id); setSortOpen(false); }}
            >
              <Text style={[s.sortOptionTxt, sortBy===opt.id && { color:meta.color, fontWeight:"700" }]}>{opt.label}</Text>
              {sortBy === opt.id && <Ionicons name="checkmark" size={16} color={meta.color} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      <View style={s.resultsBar}>
        <Text style={s.resultsTxt}>
          <Text style={s.resultsCount}>{products.length}</Text> listing{products.length!==1?"s":""}
        </Text>
        <Text style={s.sortLabel}>
          {SORT_OPTIONS.find(o=>o.id===sortBy)?.label}
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:40 }}
        ListHeaderComponent={
          products.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor:meta.bg }]}>
                <Ionicons name={meta.icon} size={36} color={meta.color} />
              </View>
              <Text style={s.emptyTitle}>No {meta.label.toLowerCase()} yet</Text>
              <Text style={s.emptySub}>Be the first to list something here</Text>
              <TouchableOpacity style={[s.postBtn, { backgroundColor:meta.headerBg }]} onPress={() => router.push("/new-listing")}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.postBtnTxt}>Post a Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.grid}>
              {rows.map((row, ri) => (
                <View key={ri} style={s.gridRow}>
                  {row.map((item, ci) => (
                    <ProductCard key={item.id} item={item} meta={meta} index={ri*2+ci} />
                  ))}
                  {row.length === 1 && <View style={{ width:CARD_W }} />}
                </View>
              ))}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:14 },
  headerCenter: { flexDirection:"row", alignItems:"center", gap:8 },
  headerIconWrap: { width:30, height:30, borderRadius:10, alignItems:"center", justifyContent:"center" },
  headerTitle: { fontSize:18, fontWeight:"800", color:"#fff" },
  searchWrap: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:16, paddingVertical:10, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  searchBar: { flex:1, flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:42 },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  sortBtn: { width:42, height:42, borderRadius:14, alignItems:"center", justifyContent:"center" },
  sortDropdown: { position:"absolute", top:120, right:16, backgroundColor:"#fff", borderRadius:16, borderWidth:1, borderColor:"#F3F4F6", zIndex:100, shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:12, elevation:12, overflow:"hidden" },
  sortOption: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:13, gap:20 },
  sortOptionTxt: { fontSize:14, color:"#374151", fontWeight:"500" },
  resultsBar: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:10, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  resultsTxt: { fontSize:13, color:"#6B7280" },
  resultsCount: { fontWeight:"800", color:"#111827" },
  sortLabel: { fontSize:12, color:"#9CA3AF", fontWeight:"500" },
  grid: { padding:16 },
  gridRow: { flexDirection:"row", gap:16 },
  card: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, marginBottom:16 },
  cardImg: { height:108, alignItems:"center", justifyContent:"center", position:"relative" },
  badge: { position:"absolute", top:7, left:7, paddingHorizontal:6, paddingVertical:2, borderRadius:8 },
  badgeTxt: { fontSize:8, fontWeight:"800" },
  saveBtn: { position:"absolute", top:7, right:7, width:26, height:26, borderRadius:13, backgroundColor:"rgba(255,255,255,0.92)", alignItems:"center", justifyContent:"center" },
  cardInfo: { padding:10 },
  cardTitle: { fontSize:12, fontWeight:"700", color:"#111827", lineHeight:17, marginBottom:4 },
  reviewCnt: { fontSize:9, color:"#9CA3AF" },
  cardSeller: { fontSize:10, color:"#9CA3AF", marginBottom:7 },
  cardFooter: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  cardPrice: { fontSize:13, fontWeight:"800" },
  addBtn: { width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center" },
  empty: { alignItems:"center", paddingTop:60, paddingHorizontal:40, gap:12 },
  emptyIcon: { width:80, height:80, borderRadius:40, alignItems:"center", justifyContent:"center", marginBottom:4 },
  emptyTitle: { fontSize:18, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
  postBtn: { flexDirection:"row", alignItems:"center", gap:7, paddingHorizontal:22, paddingVertical:12, borderRadius:16, marginTop:8 },
  postBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
});
