// app/story/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Animated, Dimensions, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W, height: H } = Dimensions.get("window");

const STORIES = {
  "2": { user:"Ada O.",   initials:"AO", bg:"#DCFCE7", color:"#15803D", items:[
    { type:"listing", title:"Stroud Maths — still available!", price:"₦4,500", tag:"Textbooks", tagBg:"#DBEAFE", tagColor:"#1E3A8A", cardBg:"#1E3A8A", icon:"book-outline" },
    { type:"promo",   title:"📦 Flash sale — 10% off today", price:null, tag:"Promo", tagBg:"#FFF7ED", tagColor:"#EA580C", cardBg:"#EA580C", icon:"pricetag-outline" },
  ]},
  "3": { user:"Emeka B.", initials:"EB", bg:"#FEF9C3", color:"#854D0E", items:[
    { type:"listing", title:"HP Charger — 1 left in stock!", price:"₦6,000", tag:"Electronics", tagBg:"#FEF9C3", tagColor:"#854D0E", cardBg:"#854D0E", icon:"flash-outline" },
  ]},
  "4": { user:"Fatima Y.",initials:"FY", bg:"#FCE7F3", color:"#9D174D", items:[
    { type:"food",    title:"Today's menu: Jollof + chicken 🍛",  price:"₦800", tag:"Food", tagBg:"#FCE7F3", tagColor:"#9D174D", cardBg:"#9D174D", icon:"restaurant-outline" },
    { type:"food",    title:"Limited plates — order now!",         price:"₦800", tag:"Food", tagBg:"#FCE7F3", tagColor:"#9D174D", cardBg:"#B45309", icon:"time-outline" },
  ]},
};

const DEFAULT_STORY = STORIES["2"];

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const story = STORIES[id] || DEFAULT_STORY;
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnims = story.items.map(() => useRef(new Animated.Value(0)).current);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {toValue:1, duration:300, useNativeDriver:true}).start();
    runProgress(0);
  }, []);

  const runProgress = (idx) => {
    if (idx >= story.items.length) { router.back(); return; }
    progressAnims[idx].setValue(0);
    Animated.timing(progressAnims[idx], {toValue:1, duration:4000, useNativeDriver:false}).start(({finished}) => {
      if (finished) {
        setCurrentIndex(idx+1);
        runProgress(idx+1);
      }
    });
  };

  const goNext = () => {
    progressAnims[currentIndex].stopAnimation();
    progressAnims[currentIndex].setValue(1);
    const next = currentIndex + 1;
    if (next >= story.items.length) { router.back(); return; }
    setCurrentIndex(next);
    runProgress(next);
  };

  const goPrev = () => {
    progressAnims[currentIndex].stopAnimation();
    progressAnims[currentIndex].setValue(0);
    const prev = Math.max(0, currentIndex - 1);
    progressAnims[prev].setValue(0);
    setCurrentIndex(prev);
    runProgress(prev);
  };

  const item = story.items[currentIndex] || story.items[0];

  return (
    <SafeAreaView style={{flex:1, backgroundColor:item.cardBg}}>
      <StatusBar barStyle="light-content" backgroundColor={item.cardBg} />
      <Animated.View style={{flex:1, opacity:fadeAnim}}>

        {/* Progress bars */}
        <View style={s.progressRow}>
          {story.items.map((_, i) => (
            <View key={i} style={s.progressTrack}>
              <Animated.View style={[
                s.progressFill,
                { width: i < currentIndex ? "100%" : i === currentIndex
                    ? progressAnims[i].interpolate({inputRange:[0,1], outputRange:["0%","100%"]})
                    : "0%"
                }
              ]} />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={s.storyHeader}>
          <View style={[s.storyAvatar, {backgroundColor:story.bg}]}>
            <Text style={[s.storyInitials, {color:story.color}]}>{story.initials}</Text>
          </View>
          <Text style={s.storyUser}>{story.user}</Text>
          <Text style={s.storyTime}>Just now</Text>
          <TouchableOpacity onPress={() => router.back()} style={{marginLeft:"auto"}}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={s.content}>
          <View style={s.iconCircle}>
            <Ionicons name={item.icon} size={52} color="rgba(255,255,255,0.3)" />
          </View>
          <Text style={s.storyTitle}>{item.title}</Text>
          {item.price && <Text style={s.storyPrice}>{item.price}</Text>}
          <View style={[s.storyTag, {backgroundColor:"rgba(255,255,255,0.2)"}]}>
            <Text style={s.storyTagTxt}>{item.tag}</Text>
          </View>
        </View>

        {/* Tap zones */}
        <TouchableOpacity style={s.tapLeft}  onPress={goPrev} activeOpacity={1} />
        <TouchableOpacity style={s.tapRight} onPress={goNext} activeOpacity={1} />

        {/* Bottom CTA */}
        <View style={s.storyFooter}>
          <TouchableOpacity style={s.viewBtn} onPress={() => { router.back(); router.push("/listing/1"); }}>
            <Text style={s.viewBtnTxt}>View Listing</Text>
            <Ionicons name="arrow-forward" size={14} color={item.cardBg} />
          </TouchableOpacity>
          <TouchableOpacity style={s.msgBtn} onPress={() => { router.back(); router.push("/messages"); }}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  progressRow: { flexDirection:"row", gap:4, paddingHorizontal:12, paddingTop:8, paddingBottom:4 },
  progressTrack: { flex:1, height:3, borderRadius:2, backgroundColor:"rgba(255,255,255,0.3)", overflow:"hidden" },
  progressFill: { height:"100%", backgroundColor:"#fff", borderRadius:2 },
  storyHeader: { flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingVertical:10, gap:10 },
  storyAvatar: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  storyInitials: { fontSize:12, fontWeight:"800" },
  storyUser: { fontSize:14, fontWeight:"700", color:"#fff" },
  storyTime: { fontSize:11, color:"rgba(255,255,255,0.6)" },
  content: { flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:32, gap:14 },
  iconCircle: { width:110, height:110, borderRadius:55, backgroundColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center" },
  storyTitle: { fontSize:22, fontWeight:"800", color:"#fff", textAlign:"center", lineHeight:30 },
  storyPrice: { fontSize:28, fontWeight:"900", color:"#fff", letterSpacing:-0.5 },
  storyTag: { paddingHorizontal:12, paddingVertical:5, borderRadius:14 },
  storyTagTxt: { fontSize:12, fontWeight:"700", color:"#fff" },
  tapLeft: { position:"absolute", left:0, top:60, bottom:80, width:"40%" },
  tapRight: { position:"absolute", right:0, top:60, bottom:80, width:"60%" },
  storyFooter: { flexDirection:"row", gap:10, paddingHorizontal:16, paddingBottom:Platform.OS==="ios"?36:20, paddingTop:10 },
  viewBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, height:48, borderRadius:16, backgroundColor:"#fff" },
  viewBtnTxt: { fontSize:14, fontWeight:"700", color:"#1E3A8A" },
  msgBtn: { width:48, height:48, borderRadius:16, backgroundColor:"rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center" },
});
