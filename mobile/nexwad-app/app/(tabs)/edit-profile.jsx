// app/edit-profile.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const FloatingInput = ({ label, value, onChangeText, icon, multiline, editable = true }) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: focused || value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused, value]);

  const top  = anim.interpolate({ inputRange:[0,1], outputRange:[multiline ? 16 : 17, -8] });
  const size = anim.interpolate({ inputRange:[0,1], outputRange:[15, 11] });
  const col  = anim.interpolate({ inputRange:[0,1], outputRange:["#9CA3AF", focused ? "#F97316" : "#6B7280"] });

  return (
    <View style={[fi.wrap, focused && fi.focused, !editable && fi.disabled, multiline && { height:110 }]}>
      <Animated.Text style={[fi.label, { top, fontSize:size, color:col }]}>{label}</Animated.Text>
      <View style={fi.row}>
        {icon && <Ionicons name={icon} size={16} color={focused ? "#F97316" : "#9CA3AF"} style={{ marginRight:8 }} />}
        <TextInput
          style={[fi.input, multiline && { height:70, textAlignVertical:"top" }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          editable={editable}
          autoCorrect={false}
        />
      </View>
    </View>
  );
};
const fi = StyleSheet.create({
  wrap: { borderWidth:1.5, borderColor:"#E5E7EB", borderRadius:16, paddingHorizontal:14, paddingTop:22, paddingBottom:10, marginBottom:14, backgroundColor:"#FAFAFA", position:"relative" },
  focused: { borderColor:"#F97316", backgroundColor:"#FFFBF7" },
  disabled: { backgroundColor:"#F9FAFB", borderColor:"#E5E7EB" },
  label: { position:"absolute", left:42, backgroundColor:"transparent", fontWeight:"500" },
  row: { flexDirection:"row", alignItems:"flex-start" },
  input: { flex:1, fontSize:15, color:"#111827", paddingTop:0 },
});

export default function EditProfile() {
  const [name,    setName]    = useState("Adaeze Okonkwo");
  const [handle,  setHandle]  = useState("ada_okonkwo");
  const [bio,     setBio]     = useState("CSC student. Selling textbooks, notes & more. Fast responses guaranteed 🤝");
  const [phone,   setPhone]   = useState("0812 345 6789");
  const [saving,  setSaving]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); router.back(); }, 1200);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[s.saveBtn, saving && { color:"#93C5FD" }]}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:60 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], padding:20 }}>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>AO</Text>
              </View>
              <TouchableOpacity style={s.cameraBtn}>
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={s.changePhotoTxt}>Change profile photo</Text>
          </View>

          <Text style={s.sectionLabel}>Personal Info</Text>
          <FloatingInput label="Full Name"     value={name}   onChangeText={setName}   icon="person-outline"  />
          <FloatingInput label="Username"      value={handle} onChangeText={setHandle} icon="at-outline"      />
          <FloatingInput label="Bio"           value={bio}    onChangeText={setBio}    icon="create-outline"  multiline />
          <FloatingInput label="Phone Number"  value={phone}  onChangeText={setPhone}  icon="call-outline"    />

          <Text style={[s.sectionLabel, { marginTop:8 }]}>Academic Info</Text>
          <FloatingInput label="Department"    value="Computer Science"  icon="school-outline"   editable={false} />
          <FloatingInput label="Level"         value="300 Level"         icon="layers-outline"   editable={false} />
          <FloatingInput label="Matric Number" value="AFIT/22/CSC/0041"  icon="id-card-outline"  editable={false} />

          <View style={s.lockedNote}>
            <Ionicons name="lock-closed-outline" size={13} color="#9CA3AF" />
            <Text style={s.lockedTxt}>Academic info is set by your AFIT student record and cannot be changed here.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  saveBtn: { fontSize:15, fontWeight:"700", color:"#1E3A8A" },
  avatarSection: { alignItems:"center", paddingVertical:20, marginBottom:8 },
  avatarWrap: { position:"relative", marginBottom:10 },
  avatar: { width:88, height:88, borderRadius:44, backgroundColor:"#DCFCE7", alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:28, fontWeight:"900", color:"#15803D" },
  cameraBtn: { position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#fff" },
  changePhotoTxt: { fontSize:13, fontWeight:"600", color:"#1E3A8A" },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  lockedNote: { flexDirection:"row", alignItems:"flex-start", gap:7, backgroundColor:"#F9FAFB", borderRadius:14, padding:12, borderWidth:1, borderColor:"#F3F4F6", marginTop:4 },
  lockedTxt: { flex:1, fontSize:12, color:"#9CA3AF", lineHeight:18 },
});
