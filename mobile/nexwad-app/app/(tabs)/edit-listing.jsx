// app/edit-listing.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Platform, Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

// Mock: in production fetch by id from API
const MOCK_LISTING = {
  title:    "HP 65W USB-C Charger",
  price:    "6000",
  desc:     "Original HP charger, compatible with most USB-C laptops. Lightly used, works perfectly. Pick up at Block A hostel.",
  category: "electronics",
  delivery: true,
};

const FloatingInput = ({ label, value, onChangeText, multiline, keyboardType, icon }) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: focused || value ? 1 : 0, duration:180, useNativeDriver:false }).start();
  }, [focused, value]);
  const top = anim.interpolate({ inputRange:[0,1], outputRange:[multiline ? 16 : 17, -8] });
  const sz  = anim.interpolate({ inputRange:[0,1], outputRange:[15,11] });
  const col = anim.interpolate({ inputRange:[0,1], outputRange:["#9CA3AF", focused ? "#1E3A8A" : "#6B7280"] });
  return (
    <View style={[fi.wrap, focused && fi.focused, multiline && {height:110}]}>
      <Animated.Text style={[fi.label, {top, fontSize:sz, color:col}]}>{label}</Animated.Text>
      <View style={fi.row}>
        {icon && <Ionicons name={icon} size={17} color={focused ? "#1E3A8A" : "#9CA3AF"} style={{marginRight:8, marginTop: multiline ? 0 : 2}} />}
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
  focused: { borderColor:"#1E3A8A", backgroundColor:"#F8FBFF" },
  label: { position:"absolute", left:42, backgroundColor:"transparent", fontWeight:"500" },
  row: { flexDirection:"row", alignItems:"flex-start" },
  input: { flex:1, fontSize:15, color:"#111827", paddingTop:2 },
});

export default function EditListing() {
  const { id } = useLocalSearchParams();

  // Pre-populate with mock data (in production: fetch by id)
  const [title,    setTitle]    = useState(MOCK_LISTING.title);
  const [price,    setPrice]    = useState(MOCK_LISTING.price);
  const [desc,     setDesc]     = useState(MOCK_LISTING.desc);
  const [category, setCategory] = useState(MOCK_LISTING.category);
  const [delivery, setDelivery] = useState(MOCK_LISTING.delivery);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const isReady = title && price && category;

  const handleSave = () => {
    if (!isReady) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.replace("/my-listings"), 2000);
    }, 1400);
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    setTimeout(() => router.replace("/my-listings"), 300);
  };

  if (saved) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:14, transform:[{ scale: doneScale }] }}>
          <View style={s.doneCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={s.doneTitle}>Listing Updated!</Text>
          <Text style={s.doneSub}>Your changes are now live.</Text>
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
        <Text style={s.headerTitle}>Edit Listing</Text>
        <TouchableOpacity onPress={() => setConfirmDelete(true)}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], padding:20 }}>

          {/* Photo row */}
          <TouchableOpacity style={s.photoBox}>
            <View style={s.photoInner}>
              <Ionicons name="camera-outline" size={26} color="#9CA3AF" />
              <Text style={s.photoTitle}>Update Photos</Text>
              <Text style={s.photoSub}>Tap to change · up to 5 photos</Text>
            </View>
          </TouchableOpacity>

          {/* Category */}
          <Text style={s.sectionLabel}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category===cat.id && { borderColor:cat.color, backgroundColor:cat.bg }]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[s.catIcon, { backgroundColor:cat.bg }]}>
                  <Ionicons name={cat.icon} size={16} color={cat.color} />
                </View>
                <Text style={[s.catTxt, category===cat.id && { color:cat.color, fontWeight:"700" }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
                <Text style={s.deliveryTitle}>Campus Delivery</Text>
                <Text style={s.deliverySub}>Charge extra ₦300 for delivery</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.toggle, delivery && s.toggleOn]} onPress={() => setDelivery(v=>!v)}>
              <View style={[s.thumb, delivery && s.thumbOn]} />
            </TouchableOpacity>
          </View>

          {/* Danger actions */}
          <View style={s.dangerCard}>
            <TouchableOpacity style={s.dangerRow} onPress={() => router.push({ pathname:"/pin-listing", params:{ id, title } })}>
              <Ionicons name="pin-outline" size={16} color="#1E3A8A" />
              <Text style={[s.dangerTxt, { color:"#1E3A8A" }]}>Pin this listing — ₦500/24hr</Text>
              <Ionicons name="chevron-forward" size={14} color="#D1D5DB" style={{ marginLeft:"auto" }} />
            </TouchableOpacity>
            <View style={{ height:1, backgroundColor:"#F3F4F6" }} />
            <TouchableOpacity style={s.dangerRow} onPress={() => setConfirmDelete(true)}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[s.dangerTxt, { color:"#EF4444" }]}>Delete this listing</Text>
              <Ionicons name="chevron-forward" size={14} color="#D1D5DB" style={{ marginLeft:"auto" }} />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Save CTA */}
      <View style={s.cta}>
        <TouchableOpacity
          style={[s.saveBtn, (!isReady || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || !isReady}
          activeOpacity={isReady ? 0.88 : 1}
        >
          <Ionicons name={saving ? "hourglass-outline" : "checkmark-circle-outline"} size={17} color="#fff" />
          <Text style={s.saveTxt}>{saving ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete confirmation */}
      <Modal transparent visible={confirmDelete} animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={s.backdrop}>
          <View style={s.confirmSheet}>
            <View style={s.confirmIcon}>
              <Ionicons name="trash-outline" size={26} color="#EF4444" />
            </View>
            <Text style={s.confirmTitle}>Delete listing?</Text>
            <Text style={s.confirmSub}>This action is permanent and cannot be undone.</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmDelete(false)}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
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
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  photoBox: { borderWidth:2, borderColor:"#E5E7EB", borderStyle:"dashed", borderRadius:20, height:110, alignItems:"center", justifyContent:"center", marginBottom:22, backgroundColor:"#F9FAFB" },
  photoInner: { alignItems:"center", gap:5 },
  photoTitle: { fontSize:14, fontWeight:"700", color:"#374151" },
  photoSub: { fontSize:12, color:"#9CA3AF" },
  sectionLabel: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
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
  dangerCard: { backgroundColor:"#fff", borderRadius:16, borderWidth:1, borderColor:"#F3F4F6", overflow:"hidden", marginBottom:8 },
  dangerRow: { flexDirection:"row", alignItems:"center", gap:12, padding:14 },
  dangerTxt: { fontSize:13, fontWeight:"600" },
  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6" },
  saveBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  saveBtnDisabled: { backgroundColor:"#93C5FD", shadowOpacity:0 },
  saveTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  doneCircle: { width:80, height:80, borderRadius:40, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center" },
  doneTitle: { fontSize:24, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280" },
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
