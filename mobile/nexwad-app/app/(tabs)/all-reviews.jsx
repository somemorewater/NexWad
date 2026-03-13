// app/all-reviews.jsx
import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Animated, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ALL_REVIEWS = [
  { id:"r1",  reviewer:"Emeka B.",    initials:"EB", bg:"#FEF9C3", color:"#854D0E", rating:5, comment:"Super fast, item exactly as described. Will buy again!",        time:"2d ago",  listing:"Stroud Maths 7th Ed"       },
  { id:"r2",  reviewer:"Fatima Y.",   initials:"FY", bg:"#FCE7F3", color:"#9D174D", rating:5, comment:"Great seller. Very responsive. Textbook in perfect condition.",  time:"1w ago",  listing:"Engineering Drawing Set"    },
  { id:"r3",  reviewer:"Chukwudi E.", initials:"CE", bg:"#EDE9FE", color:"#4C1D95", rating:4, comment:"Good transaction. Slight delay but communicated well.",         time:"2w ago",  listing:"Fluid Mechanics Textbook"   },
  { id:"r4",  reviewer:"Ngozi A.",    initials:"NA", bg:"#F0F9FF", color:"#0369A1", rating:5, comment:"Best seller on Nexwad! Item as described, fast pickup.",         time:"3w ago",  listing:"Python Tutoring Session"    },
  { id:"r5",  reviewer:"Tunde A.",    initials:"TA", bg:"#DBEAFE", color:"#1E3A8A", rating:5, comment:"Smooth transaction. Will definitely buy from Ada again.",        time:"1mo ago", listing:"Casio fx-991EX Calc"        },
  { id:"r6",  reviewer:"Amaka O.",    initials:"AO", bg:"#EDE9FE", color:"#4C1D95", rating:4, comment:"Good condition as advertised. Thanks!",                         time:"1mo ago", listing:"Second-hand Polo Set"       },
];

const Stars = ({ rating }) => (
  <View style={{ flexDirection:"row", gap:2 }}>
    {Array.from({length:5}).map((_,i) => (
      <Ionicons key={i} name={i < rating ? "star" : "star-outline"} size={12} color={i < rating ? "#F59E0B" : "#D1D5DB"} />
    ))}
  </View>
);

const ReviewItem = ({ item, index }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:300, delay:index*50, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:300, delay:index*50, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity:fa, transform:[{translateY:sa}] }}>
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor:item.bg }]}>
            <Text style={[s.avatarTxt, { color:item.color }]}>{item.initials}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.reviewerName}>{item.reviewer}</Text>
            <Stars rating={item.rating} />
          </View>
          <Text style={s.time}>{item.time}</Text>
        </View>
        <Text style={s.comment}>{item.comment}</Text>
        <View style={s.listingRef}>
          <Ionicons name="pricetag-outline" size={11} color="#9CA3AF" />
          <Text style={s.listingTxt}>{item.listing}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function AllReviews() {
  const avg = (ALL_REVIEWS.reduce((a,r) => a + r.rating, 0) / ALL_REVIEWS.length).toFixed(1);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>All Reviews</Text>
        <View style={{ width:24 }} />
      </View>

      <FlatList
        data={ALL_REVIEWS}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
        ListHeaderComponent={
          <View style={s.summaryCard}>
            <Text style={s.avgNum}>{avg}</Text>
            <View style={{ flexDirection:"row", gap:3, marginVertical:6 }}>
              {Array.from({length:5}).map((_,i) => (
                <Ionicons key={i} name={i < Math.floor(Number(avg)) ? "star" : "star-outline"} size={16} color={i < Math.floor(Number(avg)) ? "#F59E0B" : "#D1D5DB"} />
              ))}
            </View>
            <Text style={s.totalReviews}>{ALL_REVIEWS.length} reviews</Text>
          </View>
        }
        renderItem={({ item, index }) => <ReviewItem item={item} index={index} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  summaryCard: { alignItems:"center", backgroundColor:"#fff", borderRadius:20, padding:20, marginBottom:16, borderWidth:1, borderColor:"#F3F4F6" },
  avgNum: { fontSize:48, fontWeight:"900", color:"#1E3A8A", letterSpacing:-2 },
  totalReviews: { fontSize:13, color:"#9CA3AF" },
  card: { backgroundColor:"#fff", borderRadius:18, padding:14, marginBottom:12, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardHeader: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 },
  avatar: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:11, fontWeight:"800" },
  reviewerName: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:3 },
  time: { fontSize:11, color:"#9CA3AF" },
  comment: { fontSize:13, color:"#374151", lineHeight:20, marginBottom:8 },
  listingRef: { flexDirection:"row", alignItems:"center", gap:5 },
  listingTxt: { fontSize:11, color:"#9CA3AF", fontStyle:"italic" },
});
