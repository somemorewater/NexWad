// app/new-lost-found.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id:"electronics",  label:"Electronics",  icon:"flash-outline"         },
  { id:"clothing",     label:"Clothing",     icon:"shirt-outline"         },
  { id:"accessories",  label:"Accessories",  icon:"bag-handle-outline"    },
  { id:"documents",    label:"Documents",    icon:"document-text-outline" },
  { id:"keys",         label:"Keys / ID",    icon:"key-outline"           },
  { id:"books",        label:"Books",        icon:"book-outline"          },
  { id:"other",        label:"Other",        icon:"grid-outline"          },
];

const LOCATIONS = [
  "Main Library",
  "EEE Block",
  "CSC Block",
  "CVE Block",
  "Block D Classrooms",
  "Cafeteria / Dining",
  "Sports Complex",
  "Male Hostel",
  "Female Hostel",
  "Chapel / Mosque",
  "Admin Block",
  "Car Park",
];

// Floating label input component
const FloatingInput = ({ label, value, onChangeText, multiline, icon }) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  const top = anim.interpolate({ inputRange:[0,1], outputRange:[multiline ? 16 : 17, -8] });
  const sz  = anim.interpolate({ inputRange:[0,1], outputRange:[15, 11] });
  const col = anim.interpolate({ inputRange:[0,1], outputRange:["#9CA3AF", focused ? "#1E3A8A" : "#6B7280"] });

  return (
    <View style={[fi.wrap, focused && fi.focused, multiline && { height:110 }]}>
      <Animated.Text style={[fi.label, { top, fontSize:sz, color:col }]}>{label}</Animated.Text>
      <View style={fi.row}>
        {icon && (
          <Ionicons
            name={icon}
            size={17}
            color={focused ? "#1E3A8A" : "#9CA3AF"}
            style={{ marginRight:8, marginTop:multiline ? 0 : 2 }}
          />
        )}
        <TextInput
          style={[fi.input, multiline && { height:70, textAlignVertical:"top" }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          autoCapitalize="sentences"
        />
      </View>
    </View>
  );
};

const fi = StyleSheet.create({
  wrap: { borderWidth:1.5, borderColor:"#E5E7EB", borderRadius:16, paddingHorizontal:14, paddingTop:20, paddingBottom:10, marginBottom:16, backgroundColor:"#FAFAFA", position:"relative" },
  focused: { borderColor:"#1E3A8A", backgroundColor:"#F8FAFF" },
  label: { position:"absolute", left:42, backgroundColor:"transparent", fontWeight:"500" },
  row: { flexDirection:"row", alignItems:"flex-start" },
  input: { flex:1, fontSize:15, color:"#111827", paddingTop:2 },
});

export default function NewLostFound() {
  const [postType,   setPostType]   = useState("lost");  // "lost" | "found"
  const [title,      setTitle]      = useState("");
  const [description,setDescription]= useState("");
  const [location,   setLocation]   = useState("");
  const [category,   setCategory]   = useState(null);
  const [hasReward,  setHasReward]  = useState(false);
  const [reward,     setReward]     = useState("");
  const [locationOpen,setLocationOpen] = useState(false);
  const [published,  setPublished]  = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(20)).current;
  const typeAnim    = useRef(new Animated.Value(0)).current;
  const doneScale   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:450, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:450, useNativeDriver:true }),
    ]).start();
  }, []);

  const switchType = (type) => {
    Animated.spring(typeAnim, { toValue: type === "lost" ? 0 : 1, useNativeDriver:false, damping:20, stiffness:200 }).start();
    setPostType(type);
  };

  const isLost  = postType === "lost";
  const isReady = title && description && location && category;

  const typeIndicatorLeft = typeAnim.interpolate({ inputRange:[0,1], outputRange:["2%","51%"] });
  const accentColor  = isLost ? "#EF4444" : "#22C55E";
  const accentBg     = isLost ? "#FEF2F2" : "#F0FDF4";
  const accentBorder = isLost ? "#FECACA" : "#BBF7D0";

  const handlePost = () => {
    if (!isReady) return;
    setPublished(true);
    Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
    setTimeout(() => router.replace("/(tabs)/marketplace"), 2400);
  };

  if (published) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:16, transform:[{ scale: doneScale }] }}>
          <View style={[s.doneCircle, { backgroundColor: accentColor }]}>
            <Ionicons name={isLost ? "search" : "checkmark"} size={36} color="#fff" />
          </View>
          <Text style={s.doneTitle}>Post Published!</Text>
          <Text style={s.doneSub}>
            {isLost
              ? "Your lost item post is live.\nThe AFIT community will help you find it."
              : "Your found item post is live.\nSomeone will claim it soon."}
          </Text>
          <View style={[s.doneMeta, { borderColor: accentBorder, backgroundColor: accentBg }]}>
            <Text style={[s.doneMetaLabel, { color: accentColor }]}>{isLost ? "LOST" : "FOUND"}</Text>
            <Text style={s.doneMetaTitle} numberOfLines={1}>{title}</Text>
          </View>
          <Text style={s.doneRedirect}>Taking you to Lost & Found…</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post to Lost & Found</Text>
        <View style={{ width:24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:110 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], padding:20 }}>

          {/* Post type switcher */}
          <Text style={s.sectionLabel}>I am posting about something I…</Text>
          <View style={s.typeSwitcher}>
            <Animated.View style={[s.typeIndicator, {
              left: typeIndicatorLeft,
              backgroundColor: accentBg,
              borderColor: accentBorder,
            }]} />
            <TouchableOpacity style={s.typeBtn} onPress={() => switchType("lost")} activeOpacity={0.85}>
              <Ionicons name="alert-circle-outline" size={17} color={isLost ? "#EF4444" : "#9CA3AF"} />
              <Text style={[s.typeTxt, isLost && { color:"#EF4444", fontWeight:"700" }]}>Lost</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.typeBtn} onPress={() => switchType("found")} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={17} color={!isLost ? "#22C55E" : "#9CA3AF"} />
              <Text style={[s.typeTxt, !isLost && { color:"#22C55E", fontWeight:"700" }]}>Found</Text>
            </TouchableOpacity>
          </View>

          {/* Context tip */}
          <View style={[s.contextTip, { backgroundColor:accentBg, borderColor:accentBorder }]}>
            <Ionicons name="information-circle-outline" size={16} color={accentColor} />
            <Text style={[s.contextTxt, { color:accentColor }]}>
              {isLost
                ? "Describe your lost item in as much detail as possible so others can identify it."
                : "Describe the found item clearly. Don't share the exact location until you verify ownership."}
            </Text>
          </View>

          {/* Photo upload */}
          <TouchableOpacity style={s.photoBox}>
            <View style={s.photoInner}>
              <Ionicons name="camera-outline" size={26} color="#9CA3AF" />
              <Text style={s.photoTitle}>Add a Photo (Optional)</Text>
              <Text style={s.photoSub}>A photo helps people identify the item faster</Text>
            </View>
          </TouchableOpacity>

          {/* Category */}
          <Text style={s.sectionLabel}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => {
              const on = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catChip, on && { borderColor:accentColor, backgroundColor:accentBg }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons name={cat.icon} size={15} color={on ? accentColor : "#6B7280"} />
                  <Text style={[s.catTxt, on && { color:accentColor, fontWeight:"700" }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fields */}
          <FloatingInput
            label="Item Title"
            value={title}
            onChangeText={setTitle}
            icon="create-outline"
          />
          <FloatingInput
            label="Detailed Description"
            value={description}
            onChangeText={setDescription}
            icon="document-text-outline"
            multiline
          />

          {/* Location picker */}
          <Text style={s.sectionLabel}>Last Known / Found Location</Text>
          <TouchableOpacity
            style={[s.locationBtn, location && { borderColor:"#1E3A8A", backgroundColor:"#F8FAFF" }]}
            onPress={() => setLocationOpen(v => !v)}
          >
            <Ionicons name="location-outline" size={17} color={location ? "#1E3A8A" : "#9CA3AF"} />
            <Text style={[s.locationBtnTxt, location && { color:"#111827" }]}>
              {location || "Select a campus location"}
            </Text>
            <Ionicons name={locationOpen ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {locationOpen && (
            <View style={s.locationDropdown}>
              {LOCATIONS.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[s.locationOption, location===loc && { backgroundColor:"#F8FAFF" }]}
                  onPress={() => { setLocation(loc); setLocationOpen(false); }}
                >
                  <Ionicons name="location-outline" size={14} color={location===loc ? "#1E3A8A" : "#9CA3AF"} />
                  <Text style={[s.locationOptionTxt, location===loc && { color:"#1E3A8A", fontWeight:"700" }]}>
                    {loc}
                  </Text>
                  {location === loc && <Ionicons name="checkmark" size={16} color="#1E3A8A" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Reward (only for lost) */}
          {isLost && (
            <View style={{ marginTop:8 }}>
              <View style={s.rewardToggleRow}>
                <View style={s.rewardToggleLeft}>
                  <View style={s.rewardIcon}>
                    <Ionicons name="gift-outline" size={18} color="#B45309" />
                  </View>
                  <View>
                    <Text style={s.rewardToggleTitle}>Offer a Reward</Text>
                    <Text style={s.rewardToggleSub}>Increases chances of recovery</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.toggle, hasReward && { backgroundColor:"#F59E0B" }]}
                  onPress={() => setHasReward(v => !v)}
                >
                  <View style={[s.thumb, hasReward && { transform:[{translateX:20}] }]} />
                </TouchableOpacity>
              </View>
              {hasReward && (
                <View style={s.rewardInputWrap}>
                  <Text style={s.rewardInputPrefix}>₦</Text>
                  <TextInput
                    style={s.rewardInput}
                    placeholder="Enter reward amount"
                    placeholderTextColor="#9CA3AF"
                    value={reward}
                    onChangeText={setReward}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          )}

          {/* Tips */}
          <View style={s.tipsCard}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:7, marginBottom:8 }}>
              <Ionicons name="bulb-outline" size={14} color="#F97316" />
              <Text style={s.tipsTitle}>Tips for a better post</Text>
            </View>
            {(isLost ? [
              "Mention distinguishing marks (name tags, stickers, scratches)",
              "Include the exact time and place you last had it",
              "List what was inside the bag or case if applicable",
            ] : [
              "Do not reveal the exact pickup location publicly",
              "Ask the owner to describe details to verify ownership",
              "Hand over only after confirming identity",
            ]).map(tip => (
              <View key={tip} style={{ flexDirection:"row", gap:8, marginBottom:5 }}>
                <Ionicons name="checkmark-circle" size={13} color={accentColor} style={{ marginTop:1 }} />
                <Text style={s.tipsTxt}>{tip}</Text>
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        <TouchableOpacity
          style={[s.publishBtn,
            { backgroundColor: isReady ? accentColor : "#D1D5DB" },
            isReady && { shadowColor: accentColor }
          ]}
          onPress={handlePost}
        >
          <Ionicons
            name={isLost ? "alert-circle-outline" : "checkmark-circle-outline"}
            size={17}
            color="#fff"
          />
          <Text style={s.publishTxt}>
            {isLost ? "Post Lost Item" : "Post Found Item"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },

  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },

  typeSwitcher: { flexDirection:"row", backgroundColor:"#F3F4F6", borderRadius:16, padding:4, position:"relative", marginBottom:14 },
  typeIndicator: { position:"absolute", top:4, width:"48%", height:"100%", borderRadius:13, borderWidth:1.5, shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2 },
  typeBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:7, paddingVertical:11, zIndex:1 },
  typeTxt: { fontSize:14, fontWeight:"600", color:"#9CA3AF" },

  contextTip: { flexDirection:"row", gap:9, borderRadius:14, padding:12, borderWidth:1, marginBottom:18 },
  contextTxt: { flex:1, fontSize:12, lineHeight:18, fontWeight:"500" },

  photoBox: { borderWidth:2, borderColor:"#E5E7EB", borderStyle:"dashed", borderRadius:20, height:110, alignItems:"center", justifyContent:"center", marginBottom:22, backgroundColor:"#F9FAFB" },
  photoInner: { alignItems:"center", gap:5 },
  photoTitle: { fontSize:13, fontWeight:"700", color:"#374151" },
  photoSub: { fontSize:11, color:"#9CA3AF" },

  catGrid: { flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:18 },
  catChip: { flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:11, paddingVertical:8, borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB" },
  catTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },

  locationBtn: { flexDirection:"row", alignItems:"center", gap:10, borderWidth:1.5, borderColor:"#E5E7EB", borderRadius:16, paddingHorizontal:14, paddingVertical:14, backgroundColor:"#FAFAFA", marginBottom:4 },
  locationBtnTxt: { flex:1, fontSize:15, color:"#9CA3AF" },
  locationDropdown: { backgroundColor:"#fff", borderRadius:16, borderWidth:1, borderColor:"#E5E7EB", marginBottom:16, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:12, elevation:8 },
  locationOption: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  locationOptionTxt: { flex:1, fontSize:14, color:"#374151", fontWeight:"500" },

  rewardToggleRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#FEF9C3", borderRadius:16, padding:14, borderWidth:1, borderColor:"#FDE68A", marginBottom:12 },
  rewardToggleLeft: { flexDirection:"row", alignItems:"center", gap:10 },
  rewardIcon: { width:36, height:36, borderRadius:10, backgroundColor:"#FEF3C7", alignItems:"center", justifyContent:"center" },
  rewardToggleTitle: { fontSize:13, fontWeight:"700", color:"#92400E" },
  rewardToggleSub: { fontSize:11, color:"#B45309", marginTop:1 },
  toggle: { width:44, height:24, borderRadius:12, backgroundColor:"#E5E7EB", justifyContent:"center", paddingHorizontal:2 },
  thumb: { width:20, height:20, borderRadius:10, backgroundColor:"#fff", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.15, shadowRadius:2, elevation:2 },
  rewardInputWrap: { flexDirection:"row", alignItems:"center", backgroundColor:"#F9FAFB", borderRadius:14, borderWidth:1.5, borderColor:"#FDE68A", paddingHorizontal:14, height:50, gap:6, marginBottom:12 },
  rewardInputPrefix: { fontSize:16, fontWeight:"700", color:"#B45309" },
  rewardInput: { flex:1, fontSize:15, color:"#111827" },

  tipsCard: { backgroundColor:"#FFF7ED", borderRadius:16, padding:14, borderWidth:1, borderColor:"#FED7AA", marginTop:4 },
  tipsTitle: { fontSize:12, fontWeight:"700", color:"#EA580C" },
  tipsTxt: { fontSize:12, color:"#374151", lineHeight:18, flex:1 },

  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  publishBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  publishTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  doneCircle: { width:88, height:88, borderRadius:44, alignItems:"center", justifyContent:"center", shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:20, elevation:12 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:22 },
  doneMeta: { borderRadius:16, paddingHorizontal:28, paddingVertical:14, alignItems:"center", borderWidth:1, gap:4 },
  doneMetaLabel: { fontSize:10, fontWeight:"900", letterSpacing:1.5 },
  doneMetaTitle: { fontSize:15, fontWeight:"700", color:"#111827" },
  doneRedirect: { fontSize:12, color:"#9CA3AF" },
});
