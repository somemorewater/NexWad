// app/my-listings.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, Platform, Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const LISTINGS = [
  { id:"l1", title:"HP 65W USB-C Charger",             price:"₦6,000",       category:"Electronics", status:"active",  views:124, saves:21, orders:8,  imgBg:"#FEF9C3", imgIcon:"flash-outline",       imgColor:"#854D0E", isPinned:true,  pinExpiry:"6h left"  },
  { id:"l2", title:"Stroud Engineering Maths 7th Ed",  price:"₦4,500",       category:"Textbooks",   status:"active",  views:98,  saves:19, orders:14, imgBg:"#DBEAFE", imgIcon:"book-outline",        imgColor:"#1E3A8A", isPinned:false, pinExpiry:null       },
  { id:"l3", title:"Python Tutoring Session (1hr)",    price:"₦3,000/hr",    category:"Services",    status:"active",  views:76,  saves:12, orders:10, imgBg:"#EDE9FE", imgIcon:"desktop-outline",     imgColor:"#4C1D95", isPinned:false, pinExpiry:null       },
  { id:"l4", title:"Casio fx-991EX Calculator",        price:"₦5,500",       category:"Electronics", status:"sold",    views:54,  saves:9,  orders:6,  imgBg:"#F0F9FF", imgIcon:"calculator-outline",  imgColor:"#0369A1", isPinned:false, pinExpiry:null       },
  { id:"l5", title:"Engineering Drawing Set",          price:"₦3,800",       category:"Stationery",  status:"paused",  views:32,  saves:5,  orders:2,  imgBg:"#EDE9FE", imgIcon:"pencil-outline",      imgColor:"#4C1D95", isPinned:false, pinExpiry:null       },
];

const STATUS_META = {
  active: { label:"Active",  color:"#15803D", bg:"#F0FDF4", dot:"#22C55E" },
  sold:   { label:"Sold",    color:"#6B7280", bg:"#F3F4F6", dot:"#9CA3AF" },
  paused: { label:"Paused",  color:"#B45309", bg:"#FEF9C3", dot:"#F59E0B" },
};

const TABS = ["All", "Active", "Sold", "Paused"];

export default function MyListings() {
  const [tab,         setTab]         = useState("All");
  const [listings,    setListings]    = useState(LISTINGS);
  const [menuItem,    setMenuItem]    = useState(null); // item with open menu
  const [confirmDel,  setConfirmDel]  = useState(null); // item pending delete confirm

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const filtered = tab === "All" ? listings : listings.filter(l => l.status === tab.toLowerCase());

  const markSold   = (id) => { setListings(prev => prev.map(l => l.id===id ? {...l, status:"sold",   isPinned:false} : l)); setMenuItem(null); };
  const pauseListing=(id)=> { setListings(prev => prev.map(l => l.id===id ? {...l, status:"paused"} : l)); setMenuItem(null); };
  const resumeListing=(id)=>{ setListings(prev => prev.map(l => l.id===id ? {...l, status:"active"} : l)); setMenuItem(null); };
  const deleteListing=(id)=>{ setListings(prev => prev.filter(l => l.id!==id)); setConfirmDel(null); };

  const activeCount = listings.filter(l => l.status==="active").length;
  const soldCount   = listings.filter(l => l.status==="sold").length;

  const ListingCard = ({ item, index }) => {
    const fa = useRef(new Animated.Value(0)).current;
    const sa = useRef(new Animated.Value(14)).current;
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fa, { toValue:1, duration:320, delay:index*55, useNativeDriver:true }),
        Animated.timing(sa, { toValue:0, duration:320, delay:index*55, useNativeDriver:true }),
      ]).start();
    }, []);

    const meta = STATUS_META[item.status];
    const isMenuOpen = menuItem?.id === item.id;

    return (
      <Animated.View style={[s.card, { opacity:fa, transform:[{translateY:sa}] }]}>
        {/* Pin banner */}
        {item.isPinned && (
          <View style={s.pinBanner}>
            <Ionicons name="pin" size={11} color="#fff" />
            <Text style={s.pinBannerTxt}>Pinned · {item.pinExpiry}</Text>
          </View>
        )}

        <TouchableOpacity
          style={s.cardInner}
          onPress={() => router.push(`/listing/${item.id}`)}
          activeOpacity={0.88}
        >
          {/* Image */}
          <View style={[s.img, { backgroundColor: item.imgBg }]}>
            <Ionicons name={item.imgIcon} size={24} color={item.imgColor} />
          </View>

          {/* Info */}
          <View style={{ flex:1 }}>
            <View style={s.cardTop}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
              {/* Three-dot menu */}
              <View>
                <TouchableOpacity
                  style={s.menuBtn}
                  onPress={() => setMenuItem(isMenuOpen ? null : item)}
                  hitSlop={{top:8,bottom:8,left:8,right:8}}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#6B7280" />
                </TouchableOpacity>
                {isMenuOpen && (
                  <View style={s.menu}>
                    <TouchableOpacity style={s.menuRow} onPress={() => { setMenuItem(null); router.push({ pathname:"/edit-listing", params:{id:item.id} }); }}>
                      <Ionicons name="create-outline" size={15} color="#374151" />
                      <Text style={s.menuTxt}>Edit listing</Text>
                    </TouchableOpacity>
                    {item.status === "active" && (
                      <TouchableOpacity style={s.menuRow} onPress={() => { setMenuItem(null); router.push({ pathname:"/pin-listing", params:{id:item.id, title:item.title} }); }}>
                        <Ionicons name="pin-outline" size={15} color="#1E3A8A" />
                        <Text style={[s.menuTxt, { color:"#1E3A8A" }]}>Pin listing</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "active" && (
                      <TouchableOpacity style={s.menuRow} onPress={() => markSold(item.id)}>
                        <Ionicons name="checkmark-circle-outline" size={15} color="#15803D" />
                        <Text style={[s.menuTxt, { color:"#15803D" }]}>Mark as sold</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "active" && (
                      <TouchableOpacity style={s.menuRow} onPress={() => pauseListing(item.id)}>
                        <Ionicons name="pause-circle-outline" size={15} color="#B45309" />
                        <Text style={[s.menuTxt, { color:"#B45309" }]}>Pause listing</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "paused" && (
                      <TouchableOpacity style={s.menuRow} onPress={() => resumeListing(item.id)}>
                        <Ionicons name="play-circle-outline" size={15} color="#15803D" />
                        <Text style={[s.menuTxt, { color:"#15803D" }]}>Resume listing</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.menuRow, { borderBottomWidth:0 }]} onPress={() => { setMenuItem(null); setConfirmDel(item); }}>
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      <Text style={[s.menuTxt, { color:"#EF4444" }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={s.cardMid}>
              <Text style={s.cardPrice}>{item.price}</Text>
              <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
                <View style={[s.statusDot, { backgroundColor: meta.dot }]} />
                <Text style={[s.statusTxt, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={s.cardStats}>
              <View style={s.stat}>
                <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
                <Text style={s.statTxt}>{item.views}</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="bookmark-outline" size={12} color="#9CA3AF" />
                <Text style={s.statTxt}>{item.saves}</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="bag-check-outline" size={12} color="#9CA3AF" />
                <Text style={s.statTxt}>{item.orders}</Text>
              </View>
              <Text style={s.cardCategory}>{item.category}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Listings</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/new-listing")}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <Animated.View style={[s.strip, { opacity:fadeAnim }]}>
        <View style={s.stripItem}>
          <Text style={s.stripValue}>{activeCount}</Text>
          <Text style={s.stripLabel}>Active</Text>
        </View>
        <View style={s.stripDivider} />
        <View style={s.stripItem}>
          <Text style={s.stripValue}>{soldCount}</Text>
          <Text style={s.stripLabel}>Sold</Text>
        </View>
        <View style={s.stripDivider} />
        <View style={s.stripItem}>
          <Text style={s.stripValue}>{listings.length}</Text>
          <Text style={s.stripLabel}>Total</Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding:16, gap:12, paddingBottom:40 }}
          renderItem={({ item, index }) => <ListingCard item={item} index={index} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="grid-outline" size={44} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No {tab === "All" ? "" : tab.toLowerCase()} listings</Text>
              <Text style={s.emptySub}>
                {tab === "All" ? "Tap + to post your first listing" : `You have no ${tab.toLowerCase()} listings`}
              </Text>
              {tab === "All" && (
                <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/new-listing")}>
                  <Text style={s.emptyBtnTxt}>Create listing</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </Animated.View>

      {/* Delete confirmation modal */}
      <Modal transparent visible={!!confirmDel} animationType="fade" onRequestClose={() => setConfirmDel(null)}>
        <View style={s.backdrop}>
          <View style={s.confirmSheet}>
            <View style={s.confirmIcon}>
              <Ionicons name="trash-outline" size={26} color="#EF4444" />
            </View>
            <Text style={s.confirmTitle}>Delete listing?</Text>
            <Text style={s.confirmSub} numberOfLines={2}>"{confirmDel?.title}" will be permanently removed.</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmDel(null)}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => deleteListing(confirmDel?.id)}>
                <Text style={s.deleteBtnTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  addBtn: { width:34, height:34, borderRadius:17, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },

  strip: { flexDirection:"row", backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6", paddingVertical:12 },
  stripItem: { flex:1, alignItems:"center" },
  stripValue: { fontSize:20, fontWeight:"900", color:"#111827" },
  stripLabel: { fontSize:11, color:"#9CA3AF", fontWeight:"600", marginTop:2 },
  stripDivider: { width:1, backgroundColor:"#F3F4F6" },

  tabRow: { flexDirection:"row", paddingHorizontal:16, paddingVertical:10, gap:8, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  tabBtn: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor:"#F3F4F6" },
  tabBtnActive: { backgroundColor:"#1E3A8A" },
  tabTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  tabTxtActive: { color:"#fff", fontWeight:"800" },

  card: { backgroundColor:"#fff", borderRadius:18, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden" },
  pinBanner: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#1E3A8A", paddingHorizontal:12, paddingVertical:5 },
  pinBannerTxt: { fontSize:11, fontWeight:"700", color:"#fff" },
  cardInner: { flexDirection:"row", gap:12, padding:14 },
  img: { width:58, height:58, borderRadius:14, alignItems:"center", justifyContent:"center" },
  cardTop: { flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 },
  cardTitle: { flex:1, fontSize:14, fontWeight:"700", color:"#111827", marginRight:8 },
  menuBtn: { padding:2 },
  menu: { position:"absolute", top:26, right:0, backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:12, elevation:12, zIndex:100, minWidth:170 },
  menuRow: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  menuTxt: { fontSize:13, fontWeight:"600", color:"#374151" },
  cardMid: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
  cardPrice: { fontSize:15, fontWeight:"900", color:"#1E3A8A" },
  statusPill: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusTxt: { fontSize:10, fontWeight:"700" },
  cardStats: { flexDirection:"row", alignItems:"center", gap:12 },
  stat: { flexDirection:"row", alignItems:"center", gap:4 },
  statTxt: { fontSize:11, color:"#9CA3AF" },
  cardCategory: { marginLeft:"auto", fontSize:10, fontWeight:"700", color:"#9CA3AF", backgroundColor:"#F3F4F6", paddingHorizontal:7, paddingVertical:2, borderRadius:6 },

  empty: { alignItems:"center", paddingTop:60, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
  emptyBtn: { marginTop:8, paddingHorizontal:20, paddingVertical:10, borderRadius:14, backgroundColor:"#1E3A8A" },
  emptyBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },

  backdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center" },
  confirmSheet: { backgroundColor:"#fff", borderRadius:24, padding:24, width:"82%", alignItems:"center", gap:10 },
  confirmIcon: { width:56, height:56, borderRadius:28, backgroundColor:"#FEF2F2", alignItems:"center", justifyContent:"center", marginBottom:4 },
  confirmTitle: { fontSize:18, fontWeight:"900", color:"#111827" },
  confirmSub: { fontSize:13, color:"#6B7280", textAlign:"center" },
  confirmBtns: { flexDirection:"row", gap:12, marginTop:8, width:"100%" },
  cancelBtn: { flex:1, height:46, borderRadius:14, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  cancelBtnTxt: { fontSize:14, fontWeight:"700", color:"#374151" },
  deleteBtn: { flex:1, height:46, borderRadius:14, backgroundColor:"#EF4444", alignItems:"center", justifyContent:"center" },
  deleteBtnTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
});
