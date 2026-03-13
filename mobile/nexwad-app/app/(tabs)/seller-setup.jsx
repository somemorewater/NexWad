// app/seller-setup.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id:"books",       label:"Books & Notes",   icon:"book-outline"        },
  { id:"electronics", label:"Electronics",      icon:"phone-portrait-outline" },
  { id:"fashion",     label:"Fashion",          icon:"shirt-outline"       },
  { id:"food",        label:"Food & Drinks",    icon:"fast-food-outline"   },
  { id:"services",    label:"Services",         icon:"construct-outline"   },
  { id:"sports",      label:"Sports & Fitness", icon:"football-outline"    },
  { id:"beauty",      label:"Beauty",           icon:"sparkles-outline"    },
  { id:"other",       label:"Other",            icon:"grid-outline"        },
];

const STEPS = ["Shop Info", "Verify ID", "Category"];

function StepBar({ current }) {
  return (
    <View style={sb.wrap}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={sb.item}>
              <View style={[sb.circle, done && sb.done, active && sb.active]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[sb.num, active && sb.numActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[sb.lbl, active && sb.lblActive, done && sb.lblDone]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sb.line, done && sb.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap:      { flexDirection:"row", alignItems:"center", paddingHorizontal:24, paddingVertical:14, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  item:      { alignItems:"center", gap:4 },
  circle:    { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#fff", alignItems:"center", justifyContent:"center" },
  active:    { borderColor:"#1E3A8A", backgroundColor:"#1E3A8A" },
  done:      { borderColor:"#15803D", backgroundColor:"#15803D" },
  num:       { fontSize:11, fontWeight:"700", color:"#9CA3AF" },
  numActive: { color:"#fff" },
  lbl:       { fontSize:10, fontWeight:"600", color:"#9CA3AF" },
  lblActive: { color:"#1E3A8A", fontWeight:"800" },
  lblDone:   { color:"#15803D" },
  line:      { flex:1, height:2, backgroundColor:"#E5E7EB", marginBottom:14 },
  lineDone:  { backgroundColor:"#15803D" },
});

export default function SellerSetup() {
  const [step,        setStep]        = useState(0);
  const [shopName,    setShopName]    = useState("");
  const [shopDesc,    setShopDesc]    = useState("");
  const [whatsapp,    setWhatsapp]    = useState("");
  const [location,    setLocation]    = useState("");
  const [nin,         setNin]         = useState("");
  const [schoolIdUploaded, setSchoolIdUploaded] = useState(false);
  const [categories,  setCategories]  = useState([]);
  const [done,        setDone]        = useState(false);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(20)).current;
  const doneScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const toggleCat = (id) => {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    setDone(true);
    Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
    setTimeout(() => router.replace("/(tabs)/profile"), 2400);
  };

  const canProceed0 = shopName.trim().length >= 3;
  const canProceed1 = nin.trim().length === 11 && schoolIdUploaded;
  const canProceed2 = categories.length >= 1;

  // ── DONE SCREEN ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <Animated.View style={[s.doneBox, { transform:[{ scale: doneScale }] }]}>
          <View style={s.doneCircle}>
            <Ionicons name="time-outline" size={38} color="#fff" />
          </View>
          <Text style={s.doneTitle}>Application Submitted!</Text>
          <Text style={s.doneSub}>Your seller application is under review.</Text>
          <Text style={s.doneHint}>
            Our admin team will review your details including your NIN and School ID. You'll receive a notification once approved or rejected — usually within 24 hours.
          </Text>
          <View style={s.doneTag}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#0369A1" />
            <Text style={s.doneTagTxt}>Pending admin approval</Text>
          </View>
          <TouchableOpacity style={s.doneHomeBtn} onPress={() => router.replace("/(tabs)/feed")}>
            <Text style={s.doneHomeBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View style={s.header}>
        {step > 0
          ? <TouchableOpacity onPress={() => setStep(s => s - 1)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          : <View style={{ width:24 }} />
        }
        <Text style={s.headerTitle}>Set Up Your Shop</Text>
        <View style={{ width:24 }} />
      </View>

      <StepBar current={step} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:120 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* ── STEP 0: SHOP INFO ──────────────────────────────────────────── */}
          {step === 0 && (
            <View style={s.section}>

              {/* Shop logo picker */}
              <View style={s.logoPicker}>
                <TouchableOpacity style={s.logoCircle} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                  <Text style={s.logoHint}>Add logo</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.sectionTitle}>Shop Details</Text>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Shop Name *</Text>
                <TextInput
                  style={[s.fieldInput, shopName.length > 0 && shopName.trim().length < 3 && s.fieldInputErr]}
                  placeholder="e.g. Ada's Bookshop"
                  placeholderTextColor="#9CA3AF"
                  value={shopName}
                  onChangeText={setShopName}
                  maxLength={40}
                />
                <Text style={s.fieldHint}>{shopName.length}/40 characters</Text>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Shop Description</Text>
                <TextInput
                  style={[s.fieldInput, { height:90, textAlignVertical:"top", paddingTop:12 }]}
                  placeholder="Tell buyers what you sell…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={shopDesc}
                  onChangeText={setShopDesc}
                  maxLength={160}
                />
                <Text style={s.fieldHint}>{shopDesc.length}/160 characters</Text>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>WhatsApp Number</Text>
                <View style={s.phoneRow}>
                  <View style={s.phonePrefix}>
                    <Text style={s.phonePrefixTxt}>🇳🇬 +234</Text>
                  </View>
                  <TextInput
                    style={[s.fieldInput, { flex:1, marginBottom:0 }]}
                    placeholder="08012345678"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.fieldLabel}>Pickup / Delivery Location</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="e.g. Block C hostel, Main gate"
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={setLocation}
                  maxLength={80}
                />
              </View>

              <View style={s.infoNote}>
                <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
                <Text style={s.infoNoteTxt}>You can update all these details from your seller dashboard later.</Text>
              </View>
            </View>
          )}

          {/* ── STEP 1: VERIFY ID ──────────────────────────────────────────── */}
          {step === 1 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Identity Verification</Text>
              <Text style={s.sectionSub}>Required for seller approval. Your details are reviewed by admins and kept private.</Text>

              {/* NIN */}
              <View style={s.field}>
                <Text style={s.fieldLabel}>NIN (National ID Number) *</Text>
                <TextInput
                  style={[s.fieldInput, nin.length > 0 && nin.length !== 11 && s.fieldInputErr]}
                  placeholder="11-digit NIN"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={11}
                  value={nin}
                  onChangeText={setNin}
                />
                {nin.length > 0 && nin.length !== 11 && (
                  <Text style={s.fieldErr}>NIN must be exactly 11 digits</Text>
                )}
              </View>

              {/* School ID Upload */}
              <View style={s.field}>
                <Text style={s.fieldLabel}>School ID Card *</Text>
                <TouchableOpacity
                  style={[s.uploadBox, schoolIdUploaded && s.uploadBoxDone]}
                  activeOpacity={0.8}
                  onPress={() => setSchoolIdUploaded(true)}
                >
                  {schoolIdUploaded ? (
                    <>
                      <View style={s.uploadDoneIcon}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      </View>
                      <Text style={s.uploadDoneTxt}>School ID uploaded</Text>
                      <Text style={s.uploadDoneSub}>Tap to replace</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
                      <Text style={s.uploadTxt}>Tap to upload your School ID</Text>
                      <Text style={s.uploadSub}>JPG, PNG or PDF · Max 5MB</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={s.infoNote}>
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                <Text style={s.infoNoteTxt}>Your NIN and School ID are only visible to Nexwad admins during the approval process.</Text>
              </View>
            </View>
          )}

          {/* ── STEP 2: CATEGORIES ─────────────────────────────────────────── */}
          {step === 2 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>What will you sell?</Text>
              <Text style={s.sectionSub}>Pick at least one category. This helps buyers find your shop.</Text>

              <View style={s.catGrid}>
                {CATEGORIES.map(cat => {
                  const on = categories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catCard, on && s.catCardOn]}
                      onPress={() => toggleCat(cat.id)}
                      activeOpacity={0.82}
                    >
                      <View style={[s.catIconWrap, on && s.catIconWrapOn]}>
                        <Ionicons name={cat.icon} size={22} color={on?"#fff":"#6B7280"} />
                      </View>
                      <Text style={[s.catLabel, on && s.catLabelOn]}>{cat.label}</Text>
                      {on && (
                        <View style={s.catCheck}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.catCount}>
                {categories.length === 0
                  ? "Select at least 1 category"
                  : `${categories.length} categor${categories.length===1?"y":"ies"} selected`
                }
              </Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View style={s.cta}>
        {step === 0 && (
          <TouchableOpacity
            style={[s.ctaBtn, !canProceed0 && s.ctaBtnDisabled]}
            onPress={() => canProceed0 && setStep(1)}
            activeOpacity={canProceed0 ? 0.85 : 1}
          >
            <Text style={s.ctaTxt}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {step === 1 && (
          <TouchableOpacity
            style={[s.ctaBtn, !canProceed1 && s.ctaBtnDisabled]}
            onPress={() => canProceed1 && setStep(2)}
            activeOpacity={canProceed1 ? 0.85 : 1}
          >
            <Text style={s.ctaTxt}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {step === 2 && (
          <TouchableOpacity
            style={[s.ctaBtn, !canProceed2 && s.ctaBtnDisabled]}
            onPress={() => canProceed2 && handleFinish()}
            activeOpacity={canProceed2 ? 0.85 : 1}
          >
            <Ionicons name="storefront-outline" size={18} color="#FCD34D" />
            <Text style={s.ctaTxt}>Submit Application</Text>
          </TouchableOpacity>
        )}
        <Text style={s.stepCount}>Step {step + 1} of {STEPS.length}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#1E3A8A" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },

  section: { padding:16, gap:14 },
  sectionTitle: { fontSize:13, fontWeight:"800", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.8 },
  sectionSub: { fontSize:13, color:"#6B7280", marginTop:-8, lineHeight:20 },

  // Logo picker
  logoPicker: { alignItems:"center", paddingTop:8, paddingBottom:4 },
  logoCircle: { width:90, height:90, borderRadius:45, borderWidth:2, borderColor:"#E5E7EB", borderStyle:"dashed", backgroundColor:"#F9FAFB", alignItems:"center", justifyContent:"center", gap:4 },
  logoHint: { fontSize:11, color:"#9CA3AF", fontWeight:"600" },

  // Fields
  field: { gap:6 },
  fieldLabel: { fontSize:12, fontWeight:"700", color:"#374151", textTransform:"uppercase", letterSpacing:0.4 },
  fieldInput: { height:48, borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", paddingHorizontal:14, fontSize:14, color:"#111827", marginBottom:0 },
  fieldInputErr: { borderColor:"#FCA5A5" },
  fieldErr: { fontSize:11, color:"#EF4444", marginTop:-2 },

  uploadBox: { borderRadius:16, borderWidth:2, borderColor:"#E5E7EB", borderStyle:"dashed", backgroundColor:"#F9FAFB", padding:24, alignItems:"center", gap:8 },
  uploadBoxDone: { borderColor:"#15803D", borderStyle:"solid", backgroundColor:"#F0FDF4" },
  uploadDoneIcon: { width:40, height:40, borderRadius:20, backgroundColor:"#15803D", alignItems:"center", justifyContent:"center" },
  uploadDoneTxt: { fontSize:14, fontWeight:"700", color:"#15803D" },
  uploadDoneSub: { fontSize:11, color:"#9CA3AF" },
  uploadTxt: { fontSize:13, fontWeight:"600", color:"#6B7280" },
  uploadSub: { fontSize:11, color:"#9CA3AF" },

  doneHomeBtn: { marginTop:8, paddingHorizontal:24, paddingVertical:12, borderRadius:14, backgroundColor:"#1E3A8A" },
  doneHomeBtnTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
  fieldHint: { fontSize:10, color:"#9CA3AF", textAlign:"right" },

  phoneRow: { flexDirection:"row", gap:8, alignItems:"center" },
  phonePrefix: { height:48, paddingHorizontal:12, borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", justifyContent:"center" },
  phonePrefixTxt: { fontSize:13, fontWeight:"700", color:"#374151" },

  infoNote: { flexDirection:"row", gap:8, backgroundColor:"#F9FAFB", borderRadius:14, padding:12 },
  infoNoteTxt: { flex:1, fontSize:12, color:"#9CA3AF", lineHeight:18 },

  // Categories
  catGrid: { flexDirection:"row", flexWrap:"wrap", gap:10 },
  catCard: { width:"47%", borderRadius:18, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB", padding:14, alignItems:"center", gap:8, position:"relative" },
  catCardOn: { borderColor:"#1E3A8A", backgroundColor:"#EFF6FF" },
  catIconWrap: { width:46, height:46, borderRadius:23, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  catIconWrapOn: { backgroundColor:"#1E3A8A" },
  catLabel: { fontSize:12, fontWeight:"600", color:"#6B7280", textAlign:"center" },
  catLabelOn: { color:"#1E3A8A", fontWeight:"700" },
  catCheck: { position:"absolute", top:8, right:8, width:18, height:18, borderRadius:9, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  catCount: { fontSize:12, color:"#6B7280", textAlign:"center", fontWeight:"600" },

  // CTA
  cta: { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6", gap:8 },
  ctaBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  ctaBtnDisabled: { backgroundColor:"#9CA3AF", shadowOpacity:0, elevation:0 },
  ctaTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  stepCount: { fontSize:12, color:"#9CA3AF", textAlign:"center" },

  // Done screen
  doneBox: { alignItems:"center", gap:14, padding:32, maxWidth:320 },
  doneCircle: { width:90, height:90, borderRadius:45, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginBottom:4 },
  doneTitle: { fontSize:26, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  doneSub: { fontSize:15, color:"#374151", fontWeight:"600", textAlign:"center" },
  doneHint: { fontSize:13, color:"#6B7280", textAlign:"center", lineHeight:20 },
  doneTag: { flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"#EFF6FF", paddingHorizontal:14, paddingVertical:7, borderRadius:12 },
  doneTagTxt: { fontSize:12, fontWeight:"700", color:"#0369A1" },
});
