// app/(tabs)/cart.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions, Platform, TextInput, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const { width: W } = Dimensions.get("window");

const PROMO_CODES = { AFIT10: 10, NEXWAD20: 20, STUDENT5: 5 };

// ─── CART ITEM ────────────────────────────────────────────────────────────────

const CartItem = ({ item, onRemove, onQtyChange }) => {
  const slideX    = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:360, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:360, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue:0, duration:260, useNativeDriver:true }),
      Animated.timing(slideX,   { toValue:-W, duration:280, useNativeDriver:true }),
    ]).start(() => onRemove(item.listingId || item.id));
  };

  const handleQtyPress = (delta) => {
    if (item.qty + delta < 1) { handleRemove(); return; }
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue:0.93, useNativeDriver:true, speed:60 }),
      Animated.spring(scaleAnim, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    onQtyChange(item.listingId || item.id, delta);
  };

  const listing = item.listing || item;
  const price   = Number(listing.price || item.price || 0);
  const qty     = item.quantity || item.qty || 1;

  return (
    <Animated.View style={[CI.wrap, { opacity:fadeAnim, transform:[{translateY:slideAnim},{translateX:slideX}] }]}>
      <View style={CI.card}>
        <View style={[CI.img, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="pricetag-outline" size={30} color="#1E3A8A" style={{ opacity:0.35 }} />
        </View>
        <View style={CI.info}>
          <View style={CI.topRow}>
            <View style={[CI.tag, { backgroundColor:"#DBEAFE" }]}>
              <Text style={[CI.tagTxt, { color:"#1E3A8A" }]}>{listing.category || "Item"}</Text>
            </View>
            <TouchableOpacity onPress={handleRemove} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={CI.title} numberOfLines={2}>{listing.title || "Item"}</Text>
          <TouchableOpacity style={CI.sellerRow} onPress={() => router.push(`/(tabs)/seller/${listing.seller?.username || listing.seller?.id}`)}>
            <View style={[CI.sellerDot, { backgroundColor:"#DCFCE7" }]}>
              <Text style={[CI.sellerInit, { color:"#15803D" }]}>
                {(listing.seller?.name||"S").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={CI.sellerTxt}>{listing.seller?.name || "Seller"}</Text>
          </TouchableOpacity>
          <View style={CI.priceRow}>
            <Text style={CI.price}>₦{(price * qty).toLocaleString()}</Text>
            <Animated.View style={[CI.qtyControl, { transform:[{scale:scaleAnim}] }]}>
              <TouchableOpacity style={CI.qtyBtn} onPress={() => handleQtyPress(-1)}>
                <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={14} color={qty === 1 ? "#EF4444" : "#374151"} />
              </TouchableOpacity>
              <Text style={CI.qtyNum}>{qty}</Text>
              <TouchableOpacity style={CI.qtyBtn} onPress={() => handleQtyPress(1)}>
                <Ionicons name="add" size={14} color="#374151" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const CI = StyleSheet.create({
  wrap: { marginBottom:12 },
  card: { backgroundColor:"#fff", borderRadius:20, flexDirection:"row", overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3 },
  img: { width:90, alignItems:"center", justifyContent:"center" },
  info: { flex:1, padding:12 },
  topRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:5 },
  tag: { paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  tagTxt: { fontSize:9, fontWeight:"700", letterSpacing:0.3 },
  title: { fontSize:13, fontWeight:"700", color:"#111827", lineHeight:18, marginBottom:7 },
  sellerRow: { flexDirection:"row", alignItems:"center", gap:6, marginBottom:10 },
  sellerDot: { width:20, height:20, borderRadius:10, alignItems:"center", justifyContent:"center" },
  sellerInit: { fontSize:8, fontWeight:"800" },
  sellerTxt: { fontSize:11, color:"#6B7280", fontWeight:"500" },
  priceRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  price: { fontSize:15, fontWeight:"900", color:"#1E3A8A" },
  qtyControl: { flexDirection:"row", alignItems:"center", backgroundColor:"#F3F4F6", borderRadius:12, overflow:"hidden" },
  qtyBtn: { width:30, height:30, alignItems:"center", justifyContent:"center" },
  qtyNum: { fontSize:13, fontWeight:"800", color:"#111827", minWidth:22, textAlign:"center" },
});

// ─── PROMO INPUT ──────────────────────────────────────────────────────────────

const PromoInput = ({ onApply }) => {
  const [code,    setCode]    = useState("");
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:6,  duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:-6, duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:4,  duration:60, useNativeDriver:true }),
      Animated.timing(shakeAnim, { toValue:0,  duration:60, useNativeDriver:true }),
    ]).start();
  };

  const handleApply = () => {
    const upper = code.trim().toUpperCase();
    if (PROMO_CODES[upper] !== undefined) {
      setStatus("success");
      setMessage(`${PROMO_CODES[upper]}% discount applied!`);
      onApply(PROMO_CODES[upper]);
    } else {
      setStatus("error");
      setMessage("Invalid promo code.");
      shake();
      onApply(0);
    }
  };

  return (
    <Animated.View style={{ transform:[{translateX:shakeAnim}] }}>
      <View style={[PR.inputRow, status==="success" && PR.inputSuccess, status==="error" && PR.inputError]}>
        <Ionicons name="pricetag-outline" size={16} color={status==="success"?"#15803D":status==="error"?"#EF4444":"#9CA3AF"} />
        <TextInput
          style={PR.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter promo code"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleApply}
        />
        <TouchableOpacity style={[PR.applyBtn, code.length===0 && {opacity:0.4}]} onPress={handleApply} disabled={code.length===0}>
          <Text style={PR.applyTxt}>Apply</Text>
        </TouchableOpacity>
      </View>
      {message.length > 0 && (
        <View style={PR.messageRow}>
          <Ionicons name={status==="success"?"checkmark-circle":"close-circle"} size={13} color={status==="success"?"#15803D":"#EF4444"} />
          <Text style={[PR.messageTxt, {color:status==="success"?"#15803D":"#EF4444"}]}>{message}</Text>
        </View>
      )}
      <View style={PR.hintRow}>
        {["AFIT10","NEXWAD20"].map(c => (
          <TouchableOpacity key={c} style={PR.hintChip} onPress={() => { setCode(c); setStatus(null); setMessage(""); }}>
            <Text style={PR.hintTxt}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const PR = StyleSheet.create({
  inputRow: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#F9FAFB", borderRadius:14, paddingHorizontal:14, height:48, borderWidth:1.5, borderColor:"#E5E7EB" },
  inputSuccess: { borderColor:"#86EFAC", backgroundColor:"#F0FDF4" },
  inputError: { borderColor:"#FCA5A5", backgroundColor:"#FEF2F2" },
  input: { flex:1, fontSize:14, color:"#111827", fontWeight:"500" },
  applyBtn: { backgroundColor:"#1E3A8A", paddingHorizontal:14, paddingVertical:6, borderRadius:10 },
  applyTxt: { fontSize:12, fontWeight:"700", color:"#fff" },
  messageRow: { flexDirection:"row", alignItems:"center", gap:5, marginTop:6 },
  messageTxt: { fontSize:12, fontWeight:"600" },
  hintRow: { flexDirection:"row", gap:8, marginTop:10 },
  hintChip: { paddingHorizontal:10, paddingVertical:4, borderRadius:10, borderWidth:1, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB" },
  hintTxt: { fontSize:11, fontWeight:"600", color:"#6B7280" },
});

// ─── MAIN CART ────────────────────────────────────────────────────────────────

export default function Cart() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [discount,    setDiscount]    = useState(0);
  const [delivery,    setDelivery]    = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const emptyAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const data = await api.cart.list();
      setItems(data.items || data || []);
    } catch (err) {
      console.log("[cart error]", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:460, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:460, useNativeDriver:true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && items.length === 0) {
      Animated.timing(emptyAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    }
  }, [items, loading]);

  const removeItem = async (listingId) => {
    setItems(prev => prev.filter(i => (i.listingId || i.id) !== listingId));
    try { await api.cart.remove(listingId); } catch {}
  };

  const changeQty = (listingId, delta) => {
    setItems(prev => prev.map(i =>
      (i.listingId || i.id) === listingId
        ? { ...i, quantity: Math.max(1, (i.quantity || i.qty || 1) + delta) }
        : i
    ));
  };

  const clearCart = async () => {
    setItems([]);
    try { await api.cart.clear(); } catch {}
  };

  const subtotal    = items.reduce((sum, i) => sum + Number((i.listing||i).price||0) * (i.quantity||i.qty||1), 0);
  const deliveryFee = delivery && items.length > 0 ? 300 : 0;
  const discountAmt = Math.round(subtotal * discount / 100);
  const total       = subtotal + deliveryFee - discountAmt;
  const totalQty    = items.reduce((s, i) => s + (i.quantity||i.qty||1), 0);

  const handleCheckout = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue:0.96, useNativeDriver:true, speed:60 }),
      Animated.spring(btnScale, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    setCheckingOut(true);
    setTimeout(() => { setCheckingOut(false); router.push("/(tabs)/checkout"); }, 600);
  };

  if (!loading && items.length === 0) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={S.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={S.topBarTitle}>Cart</Text>
          <View style={{ width:24 }} />
        </View>
        <Animated.View style={[S.empty, { opacity:emptyAnim }]}>
          <View style={S.emptyIconWrap}><Ionicons name="bag-outline" size={52} color="#D1D5DB" /></View>
          <Text style={S.emptyTitle}>Your cart is empty</Text>
          <Text style={S.emptySub}>Browse the marketplace and add items to get started</Text>
          <TouchableOpacity style={S.emptyBtn} onPress={() => router.push("/(tabs)/marketplace")}>
            <Ionicons name="storefront-outline" size={16} color="#fff" />
            <Text style={S.emptyBtnTxt}>Browse Marketplace</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={S.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={S.topBarCenter}>
          <Text style={S.topBarTitle}>Cart</Text>
          <View style={S.countPill}><Text style={S.countTxt}>{totalQty}</Text></View>
        </View>
        <TouchableOpacity onPress={clearCart} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={S.clearAll}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#F97316"]} />}
      >
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          <View style={S.section}>
            <View style={S.sectionHead}>
              <Text style={S.sectionTitle}>Items</Text>
              <Text style={S.sectionSub}>{items.length} seller{items.length !== 1 ? "s" : ""}</Text>
            </View>
            {items.map(item => (
              <CartItem key={item.id} item={item} onRemove={removeItem} onQtyChange={changeQty} />
            ))}
          </View>

          {/* Delivery toggle */}
          <View style={S.card}>
            <View style={S.deliveryRow}>
              <View style={S.deliveryLeft}>
                <View style={S.deliveryIconWrap}><Ionicons name="bicycle-outline" size={20} color="#1E3A8A" /></View>
                <View>
                  <Text style={S.deliveryTitle}>Campus Delivery</Text>
                  <Text style={S.deliverySub}>Est. 1–3 hrs · ₦300 flat fee</Text>
                </View>
              </View>
              <TouchableOpacity style={[S.toggle, delivery && S.toggleOn]} onPress={() => setDelivery(v => !v)} activeOpacity={0.8}>
                <Animated.View style={[S.toggleThumb, delivery && S.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
            {delivery && (
              <View style={S.deliveryNote}>
                <Ionicons name="information-circle-outline" size={13} color="#3B82F6" />
                <Text style={S.deliveryNoteTxt}>Seller will coordinate pickup location via chat.</Text>
              </View>
            )}
          </View>

          {/* Promo code */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Promo Code</Text>
            <PromoInput onApply={(pct) => setDiscount(pct)} />
          </View>

          {/* Order summary */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Order Summary</Text>
            <View style={S.summaryRows}>
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>Subtotal ({totalQty} item{totalQty!==1?"s":""})</Text>
                <Text style={S.summaryVal}>₦{subtotal.toLocaleString()}</Text>
              </View>
              {deliveryFee > 0 && (
                <View style={S.summaryRow}>
                  <Text style={S.summaryLabel}>Delivery fee</Text>
                  <Text style={S.summaryVal}>₦{deliveryFee.toLocaleString()}</Text>
                </View>
              )}
              {discountAmt > 0 && (
                <View style={S.summaryRow}>
                  <Text style={[S.summaryLabel, {color:"#15803D"}]}>Discount ({discount}%)</Text>
                  <Text style={[S.summaryVal, {color:"#15803D"}]}>−₦{discountAmt.toLocaleString()}</Text>
                </View>
              )}
              <View style={S.summaryDivider} />
              <View style={S.summaryRow}>
                <Text style={S.totalLabel}>Total</Text>
                <Text style={S.totalVal}>₦{total.toLocaleString()}</Text>
              </View>
            </View>
            {discountAmt > 0 && (
              <View style={S.savingsBadge}>
                <Ionicons name="happy-outline" size={14} color="#15803D" />
                <Text style={S.savingsTxt}>You're saving ₦{discountAmt.toLocaleString()} on this order!</Text>
              </View>
            )}
          </View>

          {/* Payment method */}
          <View style={S.payRow}>
            <View style={S.payLeft}>
              <Ionicons name="card-outline" size={18} color="#374151" />
              <Text style={S.payTxt}>Pay on delivery or transfer</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/payments")}>
              <Text style={S.payChange}>Change</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Checkout bar */}
      <View style={S.checkoutBar}>
        <View style={S.checkoutMeta}>
          <Text style={S.checkoutTotal}>₦{total.toLocaleString()}</Text>
          <Text style={S.checkoutSub}>{totalQty} item{totalQty!==1?"s":""}{delivery?" + delivery":""}</Text>
        </View>
        <Animated.View style={{ transform:[{scale:btnScale}], flex:1 }}>
          <TouchableOpacity style={[S.checkoutBtn, checkingOut && {opacity:0.85}]} onPress={handleCheckout} activeOpacity={1}>
            {checkingOut
              ? <Text style={S.checkoutBtnTxt}>Processing…</Text>
              : <><Text style={S.checkoutBtnTxt}>Proceed to Checkout</Text><Ionicons name="arrow-forward" size={16} color="#fff" /></>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  topBar: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  topBarCenter: { flexDirection:"row", alignItems:"center", gap:8 },
  topBarTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  countPill: { backgroundColor:"#F97316", borderRadius:10, minWidth:20, height:20, alignItems:"center", justifyContent:"center", paddingHorizontal:6 },
  countTxt: { fontSize:11, fontWeight:"900", color:"#fff" },
  clearAll: { fontSize:13, fontWeight:"600", color:"#EF4444" },
  section: { paddingHorizontal:16, paddingTop:16 },
  sectionHead: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  sectionTitle: { fontSize:15, fontWeight:"800", color:"#111827" },
  sectionSub: { fontSize:12, color:"#9CA3AF" },
  card: { backgroundColor:"#fff", marginHorizontal:16, marginTop:12, borderRadius:20, padding:16, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardTitle: { fontSize:14, fontWeight:"800", color:"#111827", marginBottom:12 },
  deliveryRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  deliveryLeft: { flexDirection:"row", alignItems:"center", gap:12 },
  deliveryIconWrap: { width:40, height:40, borderRadius:12, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" },
  deliveryTitle: { fontSize:14, fontWeight:"700", color:"#111827" },
  deliverySub: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  toggle: { width:46, height:26, borderRadius:13, backgroundColor:"#E5E7EB", justifyContent:"center", paddingHorizontal:2 },
  toggleOn: { backgroundColor:"#1E3A8A" },
  toggleThumb: { width:22, height:22, borderRadius:11, backgroundColor:"#fff", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.15, shadowRadius:3, elevation:2 },
  toggleThumbOn: { transform:[{translateX:20}] },
  deliveryNote: { flexDirection:"row", alignItems:"center", gap:6, marginTop:10, backgroundColor:"#EFF6FF", borderRadius:10, padding:9 },
  deliveryNoteTxt: { fontSize:11, color:"#3B82F6", flex:1, lineHeight:16 },
  summaryRows: { gap:0 },
  summaryRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:9 },
  summaryLabel: { fontSize:13, color:"#6B7280", fontWeight:"400" },
  summaryVal: { fontSize:13, fontWeight:"600", color:"#374151" },
  summaryDivider: { height:1, backgroundColor:"#F3F4F6", marginVertical:4 },
  totalLabel: { fontSize:15, fontWeight:"800", color:"#111827" },
  totalVal: { fontSize:17, fontWeight:"900", color:"#1E3A8A" },
  savingsBadge: { flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"#F0FDF4", borderRadius:12, paddingHorizontal:12, paddingVertical:8, marginTop:12 },
  savingsTxt: { fontSize:12, fontWeight:"600", color:"#15803D" },
  payRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginHorizontal:16, marginTop:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  payLeft: { flexDirection:"row", alignItems:"center", gap:10 },
  payTxt: { fontSize:13, fontWeight:"500", color:"#374151" },
  payChange: { fontSize:13, fontWeight:"600", color:"#F97316" },
  checkoutBar: { position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", flexDirection:"row", alignItems:"center", gap:14, paddingHorizontal:16, paddingTop:12, paddingBottom:Platform.OS==="ios"?28:14, borderTopWidth:1, borderTopColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:-4}, shadowOpacity:0.07, shadowRadius:12, elevation:14 },
  checkoutMeta: { alignItems:"flex-start" },
  checkoutTotal: { fontSize:18, fontWeight:"900", color:"#1E3A8A", letterSpacing:-0.4 },
  checkoutSub: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  checkoutBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, backgroundColor:"#1E3A8A", height:52, borderRadius:18, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  checkoutBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff", letterSpacing:0.2 },
  empty: { flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:40, gap:12 },
  emptyIconWrap: { width:90, height:90, borderRadius:45, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center", marginBottom:8 },
  emptyTitle: { fontSize:20, fontWeight:"800", color:"#111827" },
  emptySub: { fontSize:14, color:"#9CA3AF", textAlign:"center", lineHeight:21 },
  emptyBtn: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#1E3A8A", paddingHorizontal:24, paddingVertical:14, borderRadius:18, marginTop:8, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.25, shadowRadius:14, elevation:8 },
  emptyBtnTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
});