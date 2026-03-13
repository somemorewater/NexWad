// app/payments.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Modal, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const INITIAL_METHODS = [
  { id:"pm1", type:"card",     label:"GTBank Debit",    sub:"•••• •••• •••• 4521", icon:"card",             bg:"#EFF6FF", color:"#1E3A8A", default:true  },
  { id:"pm2", type:"bank",     label:"Access Bank",     sub:"0123 456 789",        icon:"business",         bg:"#F0FDF4", color:"#15803D", default:false },
  { id:"pm3", type:"transfer", label:"Opay Wallet",     sub:"Connected",           icon:"phone-portrait",   bg:"#FEF9C3", color:"#B45309", default:false },
];

const ADD_OPTIONS = [
  { id:"card",     label:"Debit / Credit Card",   icon:"card-outline",            bg:"#EFF6FF", color:"#1E3A8A" },
  { id:"bank",     label:"Bank Account",           icon:"business-outline",        bg:"#F0FDF4", color:"#15803D" },
  { id:"mobile",   label:"Mobile Money / Wallet",  icon:"phone-portrait-outline",  bg:"#FEF9C3", color:"#B45309" },
];

export default function Payments() {
  const [methods,    setMethods]    = useState(INITIAL_METHODS);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [addStep,    setAddStep]    = useState(null); // null | "card" | "bank" | "mobile"
  const [cardNum,    setCardNum]    = useState("");
  const [cardName,   setCardName]   = useState("");
  const [cardExp,    setCardExp]    = useState("");
  const [cardCvv,    setCardCvv]    = useState("");

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sheetAnim = useRef(new Animated.Value(500)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const openSheet = () => {
    setSheetOpen(true);
    setAddStep(null);
    Animated.parallel([
      Animated.spring(sheetAnim,   { toValue:0,   useNativeDriver:true, damping:22, stiffness:220 }),
      Animated.timing(backdropAnim,{ toValue:1,   duration:240, useNativeDriver:true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim,    { toValue:500, duration:200, useNativeDriver:true }),
      Animated.timing(backdropAnim, { toValue:0,   duration:180, useNativeDriver:true }),
    ]).start(() => { setSheetOpen(false); setAddStep(null); });
  };

  const setDefault = (id) => setMethods(ms => ms.map(m => ({ ...m, default: m.id === id })));
  const removeMethod = (id) => setMethods(ms => ms.filter(m => m.id !== id));

  const handleAddCard = () => {
    if (!cardNum || !cardName) return;
    setMethods(ms => [...ms, {
      id: `pm${Date.now()}`, type:"card",
      label: cardName || "New Card",
      sub: `•••• •••• •••• ${cardNum.slice(-4)}`,
      icon:"card", bg:"#EFF6FF", color:"#1E3A8A", default:false,
    }]);
    setCardNum(""); setCardName(""); setCardExp(""); setCardCvv("");
    closeSheet();
  };

  const MethodCard = ({ item, index }) => {
    const fa = useRef(new Animated.Value(0)).current;
    const sa = useRef(new Animated.Value(14)).current;
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fa, { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
        Animated.timing(sa, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
      ]).start();
    }, []);

    return (
      <Animated.View style={[mc.card, item.default && mc.cardDefault, { opacity:fa, transform:[{translateY:sa}] }]}>
        <View style={[mc.iconWrap, { backgroundColor:item.bg }]}>
          <Ionicons name={item.icon} size={22} color={item.color} />
        </View>
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:7 }}>
            <Text style={mc.label}>{item.label}</Text>
            {item.default && (
              <View style={mc.defaultBadge}><Text style={mc.defaultTxt}>Default</Text></View>
            )}
          </View>
          <Text style={mc.sub}>{item.sub}</Text>
        </View>
        <View style={mc.actions}>
          {!item.default && (
            <TouchableOpacity style={mc.actionBtn} onPress={() => setDefault(item.id)}>
              <Text style={mc.actionTxt}>Set default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => removeMethod(item.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
          </TouchableOpacity>
        </View>
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
        <Text style={s.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={openSheet}>
          <Ionicons name="add-circle-outline" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
      >
        {/* Info note */}
        <View style={s.infoNote}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#1E3A8A" />
          <Text style={s.infoTxt}>Your payment info is encrypted and never shared with sellers.</Text>
        </View>

        <Text style={s.sectionLabel}>Saved Methods</Text>
        {methods.map((m, i) => <MethodCard key={m.id} item={m} index={i} />)}

        {/* Add new */}
        <TouchableOpacity style={s.addBtn} onPress={openSheet}>
          <Ionicons name="add-circle-outline" size={20} color="#1E3A8A" />
          <Text style={s.addBtnTxt}>Add payment method</Text>
        </TouchableOpacity>

        {/* Accepted banks */}
        <Text style={[s.sectionLabel, { marginTop:24 }]}>Accepted Banks</Text>
        <View style={s.banksRow}>
          {["GTBank","Access","Zenith","First Bank","UBA","Opay","Kuda","Moniepoint"].map(bank => (
            <View key={bank} style={s.bankChip}>
              <Text style={s.bankChipTxt}>{bank}</Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Add method sheet */}
      <Modal transparent visible={sheetOpen} animationType="none" onRequestClose={closeSheet}>
        <Animated.View style={[s.backdrop, { opacity:backdropAnim }]}>
          <TouchableOpacity style={{ flex:1 }} onPress={closeSheet} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[s.sheet, { transform:[{translateY:sheetAnim}] }]}>
          <View style={s.sheetHandle} />

          {!addStep ? (
            <>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>Add Payment Method</Text>
                <TouchableOpacity onPress={closeSheet}><Ionicons name="close" size={22} color="#374151" /></TouchableOpacity>
              </View>
              {ADD_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.id} style={s.addOptRow} onPress={() => setAddStep(opt.id)}>
                  <View style={[s.addOptIcon, { backgroundColor:opt.bg }]}>
                    <Ionicons name={opt.icon} size={20} color={opt.color} />
                  </View>
                  <Text style={s.addOptLabel}>{opt.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              <View style={s.sheetHeader}>
                <TouchableOpacity onPress={() => setAddStep(null)}>
                  <Ionicons name="chevron-back" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={s.sheetTitle}>
                  {addStep === "card" ? "Add Card" : addStep === "bank" ? "Bank Account" : "Mobile Wallet"}
                </Text>
                <TouchableOpacity onPress={closeSheet}><Ionicons name="close" size={22} color="#374151" /></TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {addStep === "card" && (
                  <View style={{ gap:12 }}>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>Card Number</Text>
                      <TextInput style={s.input} value={cardNum} onChangeText={setCardNum} placeholder="0000 0000 0000 0000" placeholderTextColor="#D1D5DB" keyboardType="number-pad" maxLength={19} />
                    </View>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>Cardholder Name</Text>
                      <TextInput style={s.input} value={cardName} onChangeText={setCardName} placeholder="Name on card" placeholderTextColor="#D1D5DB" />
                    </View>
                    <View style={{ flexDirection:"row", gap:12 }}>
                      <View style={[s.inputWrap, { flex:1 }]}>
                        <Text style={s.inputLabel}>Expiry</Text>
                        <TextInput style={s.input} value={cardExp} onChangeText={setCardExp} placeholder="MM/YY" placeholderTextColor="#D1D5DB" keyboardType="number-pad" maxLength={5} />
                      </View>
                      <View style={[s.inputWrap, { flex:1 }]}>
                        <Text style={s.inputLabel}>CVV</Text>
                        <TextInput style={s.input} value={cardCvv} onChangeText={setCardCvv} placeholder="•••" placeholderTextColor="#D1D5DB" keyboardType="number-pad" maxLength={3} secureTextEntry />
                      </View>
                    </View>
                    <TouchableOpacity style={s.submitBtn} onPress={handleAddCard}>
                      <Text style={s.submitBtnTxt}>Add Card</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {(addStep === "bank" || addStep === "mobile") && (
                  <View style={{ gap:12 }}>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>{addStep === "bank" ? "Bank Name" : "Wallet Provider"}</Text>
                      <TextInput style={s.input} placeholder={addStep === "bank" ? "e.g. GTBank" : "e.g. Opay"} placeholderTextColor="#D1D5DB" />
                    </View>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>{addStep === "bank" ? "Account Number" : "Phone Number"}</Text>
                      <TextInput style={s.input} placeholder={addStep === "bank" ? "0123456789" : "0812 345 6789"} placeholderTextColor="#D1D5DB" keyboardType="number-pad" />
                    </View>
                    <TouchableOpacity style={s.submitBtn} onPress={closeSheet}>
                      <Text style={s.submitBtnTxt}>Add {addStep === "bank" ? "Account" : "Wallet"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const mc = StyleSheet.create({
  card: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:14, marginBottom:12, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardDefault: { borderColor:"#BFDBFE", backgroundColor:"#F8FBFF" },
  iconWrap: { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center" },
  label: { fontSize:14, fontWeight:"700", color:"#111827" },
  defaultBadge: { backgroundColor:"#DBEAFE", paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  defaultTxt: { fontSize:9, fontWeight:"800", color:"#1E3A8A" },
  sub: { fontSize:12, color:"#9CA3AF", marginTop:2 },
  actions: { flexDirection:"row", alignItems:"center", gap:12 },
  actionBtn: { backgroundColor:"#F3F4F6", paddingHorizontal:9, paddingVertical:5, borderRadius:10 },
  actionTxt: { fontSize:11, fontWeight:"600", color:"#374151" },
});

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  infoNote: { flexDirection:"row", gap:8, backgroundColor:"#EFF6FF", borderRadius:14, padding:12, borderWidth:1, borderColor:"#BFDBFE", marginBottom:20 },
  infoTxt: { flex:1, fontSize:12, color:"#1E3A8A", lineHeight:18 },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  addBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, borderWidth:1.5, borderColor:"#BFDBFE", borderRadius:16, padding:14, borderStyle:"dashed", marginTop:4 },
  addBtnTxt: { fontSize:14, fontWeight:"600", color:"#1E3A8A" },
  banksRow: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  bankChip: { backgroundColor:"#fff", borderRadius:12, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor:"#E5E7EB" },
  bankChipTxt: { fontSize:12, fontWeight:"600", color:"#374151" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.45)" },
  sheet: { position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:20, paddingBottom:Platform.OS==="ios"?40:24, maxHeight:"85%", shadowColor:"#000", shadowOffset:{width:0,height:-4}, shadowOpacity:0.1, shadowRadius:20, elevation:20 },
  sheetHandle: { width:40, height:4, borderRadius:2, backgroundColor:"#E5E7EB", alignSelf:"center", marginTop:12, marginBottom:4 },
  sheetHeader: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F3F4F6", marginBottom:8 },
  sheetTitle: { fontSize:16, fontWeight:"800", color:"#111827" },
  addOptRow: { flexDirection:"row", alignItems:"center", gap:14, paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  addOptIcon: { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center" },
  addOptLabel: { flex:1, fontSize:15, fontWeight:"600", color:"#111827" },
  inputWrap: { gap:6 },
  inputLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.4, textTransform:"uppercase" },
  input: { backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:14, height:48, fontSize:15, color:"#111827" },
  submitBtn: { height:52, borderRadius:16, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginTop:8 },
  submitBtnTxt: { fontSize:15, fontWeight:"700", color:"#fff" },
});
