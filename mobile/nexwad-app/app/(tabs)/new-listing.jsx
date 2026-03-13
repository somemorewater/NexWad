// app/new-listing.jsx
import React, { useState, useRef, useEffect } from "react";
import {
   View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Platform, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import api from "../../src/api/client";

const CATEGORIES = [
  { id:"textbooks",   label:"Textbooks",   icon:"book-outline",        bg:"#DBEAFE", color:"#1E3A8A" },
  { id:"electronics", label:"Electronics", icon:"flash-outline",       bg:"#FEF9C3", color:"#854D0E" },
  { id:"food",        label:"Food",        icon:"restaurant-outline",  bg:"#FCE7F3", color:"#9D174D" },
  { id:"services",    label:"Services",    icon:"briefcase-outline",   bg:"#EDE9FE", color:"#4C1D95" },
  { id:"fashion",     label:"Fashion",     icon:"shirt-outline",       bg:"#DCFCE7", color:"#15803D" },
  { id:"housing",     label:"Housing",     icon:"home-outline",        bg:"#FFF7ED", color:"#EA580C" },
  { id:"stationery",  label:"Stationery",  icon:"pencil-outline",      bg:"#F0F9FF", color:"#0369A1" },
  { id:"other",       label:"Other",       icon:"grid-outline",        bg:"#F3F4F6", color:"#374151" },
];

const FloatingInput = ({ label, value, onChangeText, multiline, keyboardType, icon }) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: focused || value ? 1 : 0, duration:180, useNativeDriver:false }).start();
  }, [focused, value]);
  const top = anim.interpolate({ inputRange:[0,1], outputRange:[multiline ? 16 : 17, -8] });
  const sz  = anim.interpolate({ inputRange:[0,1], outputRange:[15,11] });
  const col = anim.interpolate({ inputRange:[0,1], outputRange:["#9CA3AF", focused ? "#F97316" : "#6B7280"] });
  return (
    <View style={[fi.wrap, focused && fi.focused, multiline && {height:110}]}>
      <Animated.Text style={[fi.label, {top, fontSize:sz, color:col}]}>{label}</Animated.Text>
      <View style={fi.row}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#F97316" : "#9CA3AF"} style={{marginRight:8, marginTop: multiline ? 0 : 2}} />}
        <TextInput
          style={[fi.input, multiline && {height:70, textAlignVertical:"top"}]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
};
const fi = StyleSheet.create({
  wrap: { borderWidth:1.5, borderColor:"#E5E7EB", borderRadius:16, paddingHorizontal:14, paddingTop:20, paddingBottom:10, marginBottom:16, backgroundColor:"#FAFAFA", position:"relative" },
  focused: { borderColor:"#F97316", backgroundColor:"#FFFBF7" },
  label: { position:"absolute", left:42, backgroundColor:"transparent", fontWeight:"500" },
  row: { flexDirection:"row", alignItems:"flex-start" },
  input: { flex:1, fontSize:15, color:"#111827", paddingTop:2 },
});

export default function NewListing() {
  const [title,    setTitle]    = useState("");
  const [price,    setPrice]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [category, setCategory] = useState(null);
  const [delivery, setDelivery] = useState(false);
  const [published, setPublished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:450, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:450, useNativeDriver:true }),
    ]).start();
  }, []);

  const isReady = title && price && category;

  const [submitting, setSubmitting] = useState(false);
const handlePublish = async () => {
  console.log("pressed");
const savedToken = await import("../../src/api/client").then(m => m.tokenStore.get());
console.log("token check:", savedToken ? "HAS TOKEN" : "NO TOKEN");
    if (!isReady || submitting) return;
    setSubmitting(true);
    try {
      await api.listings.create({
        title:       title.trim(),
        description: desc.trim(),
        price:       parseFloat(price.replace(/[^0-9.]/g, "")),
        category:    category,
        delivery:    delivery ? "both" : "pickup",
      });
      setPublished(true);
      Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.replace("/(tabs)/seller-dashboard"), 2400);
    } catch (err) {
      console.log("publish error:", err.message, JSON.stringify(err.data));
      Alert.alert("Failed to publish", err.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:16, transform:[{ scale: doneScale }] }}>
          <View style={s.doneCircle}>
            <Ionicons name="cloud-upload" size={36} color="#fff" />
          </View>
          <Text style={s.doneTitle}>Listing Published!</Text>
          <Text style={s.doneSub}>Your listing is now live on the{"\n"}Nexwad marketplace.</Text>
          <View style={s.doneMeta}>
            <Text style={s.doneMetaTitle} numberOfLines={1}>{title}</Text>
            <Text style={s.doneMetaPrice}>₦{price}</Text>
          </View>
          <Text style={s.doneRedirect}>Taking you to your dashboard…</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Listing</Text>
        <View style={{width:24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:100}} keyboardShouldPersistTaps="handled">
       <Animated.View style={{opacity:fadeAnim, transform:[{translateY:slideAnim}], padding:20}} pointerEvents="box-none">

          {/* Photo upload */}
          <TouchableOpacity style={s.photoBox}>
            <View style={s.photoInner}>
              <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
              <Text style={s.photoTitle}>Add Photos</Text>
              <Text style={s.photoSub}>Up to 5 photos</Text>
            </View>
          </TouchableOpacity>

          {/* Category */}
          <Text style={s.label}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category===cat.id && {borderColor:cat.color, backgroundColor:cat.bg}]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[s.catIcon, {backgroundColor:cat.bg}, category===cat.id && {backgroundColor: cat.color+"22"}]}>
                  <Ionicons name={cat.icon} size={16} color={cat.color} />
                </View>
                <Text style={[s.catTxt, category===cat.id && {color:cat.color, fontWeight:"700"}]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <FloatingInput label="Title"       value={title} onChangeText={setTitle} icon="create-outline" />
          <FloatingInput label="Price (₦)"   value={price} onChangeText={setPrice} icon="pricetag-outline" keyboardType="numeric" />
          <FloatingInput label="Description" value={desc}  onChangeText={setDesc}  icon="document-text-outline" multiline />

          {/* Delivery toggle */}
          <View style={s.deliveryRow}>
            <View style={s.deliveryLeft}>
              <View style={s.deliveryIcon}>
                <Ionicons name="bicycle-outline" size={18} color="#1E3A8A" />
              </View>
              <View>
                <Text style={s.deliveryTitle}>Offer Campus Delivery</Text>
                <Text style={s.deliverySub}>Charge an extra ₦300 for delivery</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.toggle, delivery && s.toggleOn]} onPress={() => setDelivery(v=>!v)}>
              <View style={[s.thumb, delivery && s.thumbOn]} />
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={s.tipsCard}>
            <View style={{flexDirection:"row", alignItems:"center", gap:7, marginBottom:8}}>
              <Ionicons name="bulb-outline" size={14} color="#F97316" />
              <Text style={s.tipsTitle}>Tips for a great listing</Text>
            </View>
            {["Use a clear, descriptive title","Add accurate photos","Set a fair price","Mention condition and pickup location"].map(tip => (
              <View key={tip} style={{flexDirection:"row", alignItems:"flex-start", gap:8, marginBottom:5}}>
                <Ionicons name="checkmark-circle" size={13} color="#15803D" style={{marginTop:1}} />
                <Text style={s.tipsTxt}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={s.cta}>
        <TouchableOpacity
  style={[s.publishBtn, !isReady && s.publishDisabled]}
  onPress={handlePublish}
  activeOpacity={0.7}
  disabled={submitting}
        >
          <Ionicons name="cloud-upload-outline" size={17} color="#fff" />
          <Text style={s.publishTxt}>Publish Listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  photoBox: { borderWidth:2, borderColor:"#E5E7EB", borderStyle:"dashed", borderRadius:20, height:130, alignItems:"center", justifyContent:"center", marginBottom:22, backgroundColor:"#F9FAFB" },
  photoInner: { alignItems:"center", gap:6 },
  photoTitle: { fontSize:14, fontWeight:"700", color:"#374151" },
  photoSub: { fontSize:12, color:"#9CA3AF" },
  label: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  catGrid: { flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:20 },
  catChip: { flexDirection:"row", alignItems:"center", gap:7, paddingHorizontal:10, paddingVertical:8, borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB" },
  catIcon: { width:28, height:28, borderRadius:8, alignItems:"center", justifyContent:"center" },
  catTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  deliveryRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"#F9FAFB", borderRadius:16, padding:14, borderWidth:1, borderColor:"#E5E7EB", marginBottom:16 },
  deliveryLeft: { flexDirection:"row", alignItems:"center", gap:10 },
  deliveryIcon: { width:36, height:36, borderRadius:10, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  deliveryTitle: { fontSize:13, fontWeight:"700", color:"#111827" },
  deliverySub: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  toggle: { width:44, height:24, borderRadius:12, backgroundColor:"#E5E7EB", justifyContent:"center", paddingHorizontal:2 },
  toggleOn: { backgroundColor:"#1E3A8A" },
  thumb: { width:20, height:20, borderRadius:10, backgroundColor:"#fff", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.15, shadowRadius:2, elevation:2 },
  thumbOn: { transform:[{translateX:20}] },
  tipsCard: { backgroundColor:"#FFF7ED", borderRadius:16, padding:14, borderWidth:1, borderColor:"#FED7AA", marginBottom:8 },
  tipsTitle: { fontSize:12, fontWeight:"700", color:"#EA580C" },
  tipsTxt: { fontSize:12, color:"#374151", lineHeight:18, flex:1 },
  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  publishBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  publishDisabled: { backgroundColor:"#93C5FD", shadowOpacity:0 },
  publishTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  doneCircle: { width:88, height:88, borderRadius:44, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:20, elevation:12 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:22 },
  doneMeta: { backgroundColor:"#F9FAFB", borderRadius:16, paddingHorizontal:28, paddingVertical:14, alignItems:"center", borderWidth:1, borderColor:"#F3F4F6", gap:4 },
  doneMetaTitle: { fontSize:15, fontWeight:"700", color:"#111827" },
  doneMetaPrice: { fontSize:22, fontWeight:"900", color:"#1E3A8A" },
  doneRedirect: { fontSize:12, color:"#9CA3AF" },
});

