// app/categories.jsx
import React, { useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id:"textbooks",   label:"Textbooks",   icon:"book-outline",          bg:"#DBEAFE", color:"#1E3A8A", count:34, desc:"Lecture notes, past questions & more" },
  { id:"electronics", label:"Electronics", icon:"flash-outline",         bg:"#FEF9C3", color:"#854D0E", count:27, desc:"Gadgets, chargers, accessories"        },
  { id:"food",        label:"Food",        icon:"restaurant-outline",    bg:"#FCE7F3", color:"#9D174D", count:18, desc:"Meals, snacks & daily delivery"        },
  { id:"services",    label:"Services",    icon:"briefcase-outline",     bg:"#EDE9FE", color:"#4C1D95", count:22, desc:"Tutoring, printing, laundry & more"    },
  { id:"fashion",     label:"Fashion",     icon:"shirt-outline",         bg:"#DCFCE7", color:"#15803D", count:15, desc:"Clothes, shoes & accessories"          },
  { id:"housing",     label:"Housing",     icon:"home-outline",          bg:"#FFF7ED", color:"#EA580C", count:9,  desc:"Rooms, sublets & hostel items"         },
  { id:"stationery",  label:"Stationery",  icon:"pencil-outline",        bg:"#F0F9FF", color:"#0369A1", count:19, desc:"Drawing sets, pens, paper & more"      },
  { id:"sports",      label:"Sports",      icon:"football-outline",      bg:"#F0FDF4", color:"#15803D", count:7,  desc:"Sports gear & fitness equipment"       },
  { id:"beauty",      label:"Beauty",      icon:"sparkles-outline",      bg:"#FDF4FF", color:"#7C3AED", count:11, desc:"Skincare, haircare & grooming"         },
  { id:"transport",   label:"Transport",   icon:"bicycle-outline",       bg:"#FFF7ED", color:"#EA580C", count:5,  desc:"Bikes, ride-sharing & logistics"       },
  { id:"tech",        label:"Tech Help",   icon:"hardware-chip-outline", bg:"#EFF6FF", color:"#2563EB", count:13, desc:"Repairs, setup & IT support"           },
  { id:"events",      label:"Events",      icon:"calendar-outline",      bg:"#FEF9C3", color:"#B45309", count:6,  desc:"Tickets, events & campus activities"   },
];

const CategoryCard = ({ item, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:340, delay:index*40, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:340, delay:index*40, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:"48%" }}>
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/category/${item.id}`)}
        activeOpacity={0.88}
      >
        <View style={[s.iconBox, { backgroundColor:item.bg }]}>
          <Ionicons name={item.icon} size={28} color={item.color} />
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardLabel}>{item.label}</Text>
          <Text style={s.cardDesc} numberOfLines={1}>{item.desc}</Text>
          <View style={[s.countPill, { backgroundColor:item.bg }]}>
            <Text style={[s.countTxt, { color:item.color }]}>{item.count} listings</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#D1D5DB" style={{ alignSelf:"center" }} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Categories() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>All Categories</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
      >
        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="grid" size={22} color="#1E3A8A" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.bannerTitle}>Browse by Category</Text>
            <Text style={s.bannerSub}>
              {CATEGORIES.reduce((a,c) => a + c.count, 0)} listings across {CATEGORIES.length} categories
            </Text>
          </View>
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} item={cat} index={i} />
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  banner: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#EFF6FF", borderRadius:18, padding:14, marginBottom:16, borderWidth:1, borderColor:"#BFDBFE" },
  bannerIcon: { width:44, height:44, borderRadius:14, backgroundColor:"#DBEAFE", alignItems:"center", justifyContent:"center" },
  bannerTitle: { fontSize:14, fontWeight:"800", color:"#1E3A8A" },
  bannerSub: { fontSize:12, color:"#3B82F6", marginTop:2 },
  grid: { flexDirection:"row", flexWrap:"wrap", gap:12 },
  card: { backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2, flexDirection:"row", alignItems:"flex-start", gap:12 },
  iconBox: { width:50, height:50, borderRadius:16, alignItems:"center", justifyContent:"center" },
  cardInfo: { flex:1, gap:3 },
  cardLabel: { fontSize:14, fontWeight:"800", color:"#111827" },
  cardDesc: { fontSize:11, color:"#9CA3AF" },
  countPill: { alignSelf:"flex-start", paddingHorizontal:8, paddingVertical:3, borderRadius:8, marginTop:2 },
  countTxt: { fontSize:10, fontWeight:"700" },
});
