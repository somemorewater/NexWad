// app/sellers.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ALL_SELLERS = [
  { id:"s1", name:"Adaeze Okonkwo", handle:"ada_sells",  initials:"AO", bg:"#DCFCE7", color:"#15803D", dept:"CSC 300L",  rating:4.9, reviews:28, sales:38, listings:12, verified:true,  tags:["Textbooks","Services","Stationery"], online:true  },
  { id:"s2", name:"Emeka Balogun",  handle:"emeka.b",    initials:"EB", bg:"#FEF9C3", color:"#854D0E", dept:"EEE 400L",  rating:4.8, reviews:7,  sales:52, listings:8,  verified:true,  tags:["Electronics","Housing"],             online:true  },
  { id:"s3", name:"Fatima Yusuf",   handle:"fatimay",    initials:"FY", bg:"#FCE7F3", color:"#9D174D", dept:"MEC 200L",  rating:5.0, reviews:34, sales:91, listings:5,  verified:true,  tags:["Food"],                              online:true  },
  { id:"s4", name:"Chukwudi Eze",   handle:"chuks.e",    initials:"CE", bg:"#EDE9FE", color:"#4C1D95", dept:"CVE 300L",  rating:4.7, reviews:11, sales:27, listings:9,  verified:false, tags:["Services","Stationery"],             online:false },
  { id:"s5", name:"Ngozi Alli",     handle:"ngozi.a",    initials:"NA", bg:"#F0F9FF", color:"#0369A1", dept:"MBA 100L",  rating:4.9, reviews:19, sales:44, listings:14, verified:true,  tags:["Electronics","Textbooks"],           online:false },
  { id:"s6", name:"Ibrahim Sani",   handle:"ibrahim.s",  initials:"IS", bg:"#FFF7ED", color:"#EA580C", dept:"PHY 200L",  rating:4.6, reviews:8,  sales:21, listings:6,  verified:false, tags:["Fashion","Stationery"],              online:false },
  { id:"s7", name:"Amaka Obi",      handle:"amaka.obi",  initials:"AO", bg:"#EDE9FE", color:"#4C1D95", dept:"LAW 300L",  rating:4.8, reviews:14, sales:33, listings:10, verified:true,  tags:["Services","Textbooks"],              online:true  },
  { id:"s8", name:"Tunde Adeleke",  handle:"tunde.a",    initials:"TA", bg:"#DBEAFE", color:"#1E3A8A", dept:"CSC 400L",  rating:4.7, reviews:6,  sales:18, listings:7,  verified:false, tags:["Electronics","Services"],            online:false },
];

const SORT_TABS = [
  { id:"top",     label:"Top Rated" },
  { id:"sales",   label:"Most Sales"},
  { id:"new",     label:"Newest"    },
];

const Stars = ({ rating, size = 11 }) => (
  <View style={{ flexDirection:"row", gap:1 }}>
    {Array.from({length:5}).map((_,i) => (
      <Ionicons key={i} name={i<Math.floor(rating)?"star":"star-outline"} size={size} color={i<Math.floor(rating)?"#F59E0B":"#D1D5DB"} />
    ))}
  </View>
);

const SellerCard = ({ item, index }) => {
  const [following, setFollowing] = useState(false);
  const [saved,     setSaved]     = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay:index*55, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay:index*55, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleFollow = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue:0.92, useNativeDriver:true, speed:60 }),
      Animated.spring(btnScale, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    setFollowing(v => !v);
  };

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity
        style={s.sellerCard}
        onPress={() => router.push(`/seller/${item.id}`)}
        activeOpacity={0.88}
      >
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor:item.bg }]}>
            <Text style={[s.avatarTxt, { color:item.color }]}>{item.initials}</Text>
          </View>
          {item.online && <View style={s.onlineDot} />}
          {item.verified && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:2 }}>
            <Text style={s.sellerName}>{item.name}</Text>
            {item.verified && (
              <View style={s.proBadge}><Text style={s.proBadgeTxt}>PRO</Text></View>
            )}
          </View>
          <Text style={s.sellerDept}>{item.dept} · @{item.handle}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:4, marginBottom:6 }}>
            <Stars rating={item.rating} />
            <Text style={s.ratingTxt}>{item.rating} · {item.reviews} reviews</Text>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{item.sales}</Text>
              <Text style={s.statLbl}>Sales</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{item.listings}</Text>
              <Text style={s.statLbl}>Listings</Text>
            </View>
          </View>
          {/* Tags */}
          <View style={s.tagsRow}>
            {item.tags.map(tag => (
              <View key={tag} style={s.tag}><Text style={s.tagTxt}>{tag}</Text></View>
            ))}
          </View>
        </View>

        {/* Follow + Save buttons */}
        <View style={{ alignItems:"flex-end", gap:8 }}>
          <Animated.View style={{ transform:[{scale:btnScale}] }}>
            <TouchableOpacity
              style={[s.followBtn, following && s.followBtnActive]}
              onPress={handleFollow}
            >
              <Text style={[s.followTxt, following && s.followTxtActive]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity onPress={() => setSaved(v => !v)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={18} color={saved ? "#1E3A8A" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Sellers() {
  const [search,  setSearch]  = useState("");
  const [sortTab, setSortTab] = useState("top");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  const sellers = ALL_SELLERS
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.dept.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortTab==="sales" ? b.sales - a.sales : b.rating - a.rating);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Top Sellers</Text>
        <View style={{ width:24 }} />
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={s.searchInput}
          placeholder="Search sellers, departments…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort tabs */}
      <View style={s.sortRow}>
        {SORT_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[s.sortTab, sortTab===tab.id && s.sortTabOn]}
            onPress={() => setSortTab(tab.id)}
          >
            <Text style={[s.sortTabTxt, sortTab===tab.id && s.sortTabTxtOn]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim }}>
        <FlatList
          data={sellers}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding:16, gap:12, paddingBottom:40 }}
          renderItem={({ item, index }) => <SellerCard item={item} index={index} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="person-outline" size={44} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No sellers found</Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  searchWrap: { flexDirection:"row", alignItems:"center", gap:8, marginHorizontal:16, marginVertical:10, backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:44 },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  sortRow: { flexDirection:"row", gap:8, paddingHorizontal:16, marginBottom:4 },
  sortTab: { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:"#F3F4F6", borderWidth:1, borderColor:"#E5E7EB" },
  sortTabOn: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  sortTabTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  sortTabTxtOn: { color:"#fff" },
  sellerCard: { flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"#fff", borderRadius:20, padding:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  avatarWrap: { position:"relative", marginTop:2 },
  avatar: { width:52, height:52, borderRadius:26, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:16, fontWeight:"800" },
  onlineDot: { position:"absolute", bottom:2, right:2, width:12, height:12, borderRadius:6, backgroundColor:"#22C55E", borderWidth:2, borderColor:"#fff" },
  verifiedBadge: { position:"absolute", top:0, right:0, width:16, height:16, borderRadius:8, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#fff" },
  sellerName: { fontSize:14, fontWeight:"800", color:"#111827" },
  proBadge: { backgroundColor:"#FFF7ED", borderWidth:1, borderColor:"#FED7AA", paddingHorizontal:5, paddingVertical:1, borderRadius:6 },
  proBadgeTxt: { fontSize:8, fontWeight:"900", color:"#EA580C" },
  sellerDept: { fontSize:11, color:"#9CA3AF" },
  ratingTxt: { fontSize:11, color:"#9CA3AF" },
  statsRow: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
  statItem: { alignItems:"center" },
  statNum: { fontSize:14, fontWeight:"800", color:"#111827" },
  statLbl: { fontSize:10, color:"#9CA3AF" },
  statDivider: { width:1, height:20, backgroundColor:"#E5E7EB" },
  tagsRow: { flexDirection:"row", flexWrap:"wrap", gap:5 },
  tag: { backgroundColor:"#F3F4F6", paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  tagTxt: { fontSize:10, fontWeight:"600", color:"#6B7280" },
  followBtn: { borderWidth:1.5, borderColor:"#1E3A8A", paddingHorizontal:14, paddingVertical:7, borderRadius:14, marginTop:2 },
  followBtnActive: { backgroundColor:"#1E3A8A" },
  followTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  followTxtActive: { color:"#fff" },
  empty: { alignItems:"center", justifyContent:"center", paddingTop:60, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
});
