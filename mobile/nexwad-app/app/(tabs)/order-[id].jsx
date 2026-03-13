// app/order/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Platform, Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ORDERS = {
  o1: {
    id:"o1", title:"Stroud Maths 7th Ed", price:"₦4,500", qty:1,
    status:"delivered", imgBg:"#DBEAFE", imgIcon:"book-outline", imgColor:"#1E3A8A",
    tag:"Textbooks", tagBg:"#DBEAFE", tagColor:"#1E3A8A",
    seller:{ name:"Ada Okonkwo", initials:"AO", bg:"#DCFCE7", color:"#15803D", handle:"ada_sells" },
    delivery:"Self Pickup · Block A, CSC Dept", payment:"Pay on Delivery",
    orderDate:"March 3, 2026", ref:"NXW-2026-001",
    timeline:[
      { label:"Order placed",        time:"March 3 · 10:12 AM", done:true  },
      { label:"Seller confirmed",     time:"March 3 · 10:48 AM", done:true  },
      { label:"Ready for pickup",     time:"March 3 · 12:00 PM", done:true  },
      { label:"Delivered",            time:"March 3 · 2:14 PM",  done:true  },
    ],
  },
  o2: {
    id:"o2", title:"HP 65W USB-C Charger", price:"₦6,000", qty:1,
    status:"transit", imgBg:"#FEF9C3", imgIcon:"flash-outline", imgColor:"#854D0E",
    tag:"Electronics", tagBg:"#FEF9C3", tagColor:"#854D0E",
    seller:{ name:"Emeka Balogun", initials:"EB", bg:"#FEF9C3", color:"#854D0E", handle:"emeka.b" },
    delivery:"Campus Delivery · Block C, Room 14", payment:"Bank Transfer",
    orderDate:"March 5, 2026", ref:"NXW-2026-004",
    timeline:[
      { label:"Order placed",        time:"March 5 · 8:30 AM",  done:true  },
      { label:"Seller confirmed",     time:"March 5 · 9:05 AM",  done:true  },
      { label:"Out for delivery",     time:"March 5 · 11:00 AM", done:true  },
      { label:"Delivered",            time:"Pending",             done:false },
    ],
  },
  o3: {
    id:"o3", title:"Jollof Rice + Protein", price:"₦800", qty:2,
    status:"pending", imgBg:"#FEF3C7", imgIcon:"restaurant-outline", imgColor:"#B45309",
    tag:"Food", tagBg:"#FCE7F3", tagColor:"#9D174D",
    seller:{ name:"Fatima Yusuf", initials:"FY", bg:"#FCE7F3", color:"#9D174D", handle:"fatimay" },
    delivery:"Campus Delivery · Block D, Female Hostel", payment:"Pay on Delivery",
    orderDate:"March 5, 2026", ref:"NXW-2026-005",
    timeline:[
      { label:"Order placed",        time:"March 5 · 12:15 PM", done:true  },
      { label:"Seller confirmed",     time:"Pending",             done:false },
      { label:"Out for delivery",     time:"Pending",             done:false },
      { label:"Delivered",            time:"Pending",             done:false },
    ],
  },
};

const STATUS_CONFIG = {
  delivered: { label:"Delivered",   color:"#15803D", bg:"#F0FDF4", icon:"checkmark-circle" },
  transit:   { label:"In Transit",  color:"#1E3A8A", bg:"#EFF6FF", icon:"bicycle"          },
  pending:   { label:"Pending",     color:"#B45309", bg:"#FEF9C3", icon:"time"             },
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const order  = ORDERS[id] || ORDERS.o1;

  // Mock: in production derive from auth token
  const isSeller = true;

  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { status, label }

  const status = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

  const SELLER_ACTIONS = {
    pending:   { nextStatus:"transit",    label:"Confirm & Mark as Dispatched", icon:"bicycle-outline",       color:"#1E3A8A", bg:"#EFF6FF" },
    transit:   { nextStatus:"delivered",  label:"Mark as Delivered",             icon:"checkmark-circle-outline", color:"#15803D", bg:"#F0FDF4" },
    delivered: null,
  };
  const sellerAction = isSeller ? SELLER_ACTIONS[currentStatus] : null;

  const handleSellerAction = () => {
    if (!pendingAction) return;
    setCurrentStatus(pendingAction.status);
    setShowConfirm(false);
    setPendingAction(null);
  };

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:420, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:420, useNativeDriver:true }),
    ]).start();
  }, []);

  const lastDoneIdx = order.timeline.reduce((a, t, i) => t.done ? i : a, -1);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
      >
        {/* Status banner */}
        <View style={[s.statusBanner, { backgroundColor:status.bg }]}>
          <View style={[s.statusIcon, { backgroundColor:status.color }]}>
            <Ionicons name={status.icon} size={22} color="#fff" />
          </View>
          <View>
            <Text style={[s.statusLabel, { color:status.color }]}>{status.label}</Text>
            <Text style={s.statusRef}>Ref: {order.ref}</Text>
          </View>
        </View>

        {/* Item card */}
        <View style={s.itemCard}>
          <View style={[s.itemImg, { backgroundColor:order.imgBg }]}>
            <Ionicons name={order.imgIcon} size={32} color={order.imgColor} style={{ opacity:0.3 }} />
          </View>
          <View style={{ flex:1 }}>
            <View style={[s.tag, { backgroundColor:order.tagBg }]}>
              <Text style={[s.tagTxt, { color:order.tagColor }]}>{order.tag}</Text>
            </View>
            <Text style={s.itemTitle}>{order.title}</Text>
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginTop:6 }}>
              <Text style={s.itemQty}>Qty: {order.qty}</Text>
              <Text style={s.itemPrice}>{order.price}</Text>
            </View>
          </View>
        </View>

        {/* Tracking timeline */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Tracking</Text>
          <View style={s.timeline}>
            {order.timeline.map((step, i) => {
              const isLast  = i === order.timeline.length - 1;
              const isCurrent = i === lastDoneIdx;
              return (
                <View key={step.label} style={s.timelineRow}>
                  {/* Left spine */}
                  <View style={s.spineCol}>
                    <View style={[
                      s.timelineDot,
                      step.done && s.timelineDotDone,
                      isCurrent && s.timelineDotCurrent,
                    ]}>
                      {step.done && <Ionicons name="checkmark" size={11} color="#fff" />}
                    </View>
                    {!isLast && <View style={[s.spineLine, step.done && s.spineLineDone]} />}
                  </View>
                  {/* Content */}
                  <View style={s.timelineContent}>
                    <Text style={[s.timelineLabel, !step.done && { color:"#9CA3AF" }]}>{step.label}</Text>
                    <Text style={[s.timelineTime, !step.done && { color:"#C4C4C4" }]}>{step.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Seller */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Seller</Text>
          <TouchableOpacity style={s.sellerRow} onPress={() => router.push(`/seller/${order.seller.handle}`)}>
            <View style={[s.sellerAvatar, { backgroundColor:order.seller.bg }]}>
              <Text style={[s.sellerInitials, { color:order.seller.color }]}>{order.seller.initials}</Text>
            </View>
            <Text style={s.sellerName}>{order.seller.name}</Text>
            <TouchableOpacity style={s.msgBtn} onPress={() => router.push("/messages")}>
              <Ionicons name="chatbubble-outline" size={14} color="#1E3A8A" />
              <Text style={s.msgBtnTxt}>Message</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Order Info</Text>
          <View style={s.infoCard}>
            {[
              { icon:"location-outline",  label:"Delivery",   value:order.delivery  },
              { icon:"card-outline",       label:"Payment",    value:order.payment   },
              { icon:"calendar-outline",   label:"Date",       value:order.orderDate },
              { icon:"receipt-outline",    label:"Reference",  value:order.ref       },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.infoRow, i < arr.length - 1 && { borderBottomWidth:1, borderBottomColor:"#F9FAFB", paddingBottom:11, marginBottom:11 }]}>
                <View style={s.infoIcon}>
                  <Ionicons name={row.icon} size={15} color="#6B7280" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.infoLabel}>{row.label}</Text>
                  <Text style={s.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        {/* Seller action — advance order status */}
        {sellerAction && (
          <TouchableOpacity
            style={[s.sellerActionBtn, { backgroundColor: sellerAction.bg, borderColor: sellerAction.color + "33" }]}
            onPress={() => { setPendingAction({ status: sellerAction.nextStatus, label: sellerAction.label }); setShowConfirm(true); }}
          >
            <View style={[s.sellerActionIcon, { backgroundColor: sellerAction.color + "22" }]}>
              <Ionicons name={sellerAction.icon} size={18} color={sellerAction.color} />
            </View>
            <Text style={[s.sellerActionTxt, { color: sellerAction.color }]}>{sellerAction.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={sellerAction.color} style={{ marginLeft:"auto" }} />
          </TouchableOpacity>
        )}

        {/* Buyer action — leave review when delivered */}
        {currentStatus === "delivered" && !isSeller && (
          <TouchableOpacity style={s.reviewBtn} onPress={() => router.push("/rate")}>
            <Ionicons name="star-outline" size={16} color="#F59E0B" />
            <Text style={s.reviewBtnTxt}>Leave a Review</Text>
          </TouchableOpacity>
        )}

        {/* Buyer cancel — only when pending */}
        {currentStatus === "pending" && !isSeller && (
          <TouchableOpacity style={s.cancelOrderBtn} onPress={() => router.back()}>
            <Text style={s.cancelOrderBtnTxt}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {/* Message button — both parties */}
        <TouchableOpacity style={s.msgBtn} onPress={() => router.push(`/chat/${order.id}`)}>
          <Ionicons name="chatbubble-outline" size={16} color="#374151" />
          <Text style={s.msgBtnTxt}>{isSeller ? "Message Buyer" : "Message Seller"}</Text>
        </TouchableOpacity>

      </Animated.ScrollView>

      {/* Confirm status change modal */}
      <Modal transparent visible={showConfirm} animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={s.backdrop}>
          <View style={s.confirmSheet}>
            <View style={s.confirmIconWrap}>
              <Ionicons name="refresh-circle-outline" size={30} color="#1E3A8A" />
            </View>
            <Text style={s.confirmTitle}>Update order status?</Text>
            <Text style={s.confirmSub}>{pendingAction?.label}</Text>
            <Text style={s.confirmRef}>Order {order.ref}</Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity style={s.confirmCancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={s.confirmCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmOkBtn} onPress={handleSellerAction}>
                <Text style={s.confirmOkTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  statusBanner: { flexDirection:"row", alignItems:"center", gap:14, borderRadius:20, padding:16, marginBottom:14 },
  statusIcon: { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center" },
  statusLabel: { fontSize:16, fontWeight:"800" },
  statusRef: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  itemCard: { flexDirection:"row", gap:12, backgroundColor:"#fff", borderRadius:20, padding:14, marginBottom:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  itemImg: { width:72, height:72, borderRadius:16, alignItems:"center", justifyContent:"center" },
  tag: { alignSelf:"flex-start", paddingHorizontal:7, paddingVertical:2, borderRadius:8, marginBottom:5 },
  tagTxt: { fontSize:9, fontWeight:"700" },
  itemTitle: { fontSize:14, fontWeight:"700", color:"#111827", lineHeight:20 },
  itemQty: { fontSize:12, color:"#9CA3AF" },
  itemPrice: { fontSize:16, fontWeight:"900", color:"#1E3A8A" },
  section: { marginBottom:16 },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  timeline: { backgroundColor:"#fff", borderRadius:20, padding:16, borderWidth:1, borderColor:"#F3F4F6" },
  timelineRow: { flexDirection:"row", gap:14 },
  spineCol: { alignItems:"center", width:24 },
  timelineDot: { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:"#E5E7EB", backgroundColor:"#fff", alignItems:"center", justifyContent:"center" },
  timelineDotDone: { backgroundColor:"#15803D", borderColor:"#15803D" },
  timelineDotCurrent: { borderColor:"#1E3A8A", borderWidth:3 },
  spineLine: { width:2, flex:1, backgroundColor:"#E5E7EB", marginVertical:4, minHeight:20 },
  spineLineDone: { backgroundColor:"#15803D" },
  timelineContent: { flex:1, paddingBottom:20 },
  timelineLabel: { fontSize:13, fontWeight:"700", color:"#111827" },
  timelineTime: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  sellerRow: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  sellerAvatar: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  sellerInitials: { fontSize:12, fontWeight:"800" },
  sellerName: { flex:1, fontSize:14, fontWeight:"700", color:"#111827" },
  msgBtn: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#EFF6FF", paddingHorizontal:12, paddingVertical:7, borderRadius:12 },
  msgBtnTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  infoCard: { backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  infoRow: { flexDirection:"row", alignItems:"flex-start", gap:12 },
  infoIcon: { width:30, height:30, borderRadius:9, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center", marginTop:2 },
  infoLabel: { fontSize:10, fontWeight:"600", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.4, marginBottom:2 },
  infoValue: { fontSize:13, fontWeight:"600", color:"#374151" },
  reviewBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:50, borderRadius:16, backgroundColor:"#FEF9C3", borderWidth:1, borderColor:"#FDE68A", marginBottom:10 },
  reviewBtnTxt: { fontSize:14, fontWeight:"700", color:"#B45309" },
  cancelOrderBtn: { height:50, borderRadius:16, alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#FECACA", marginBottom:10 },
  cancelOrderBtnTxt: { fontSize:14, fontWeight:"700", color:"#EF4444" },
  sellerActionBtn: { flexDirection:"row", alignItems:"center", gap:12, borderRadius:18, padding:14, borderWidth:1, marginBottom:10 },
  sellerActionIcon: { width:38, height:38, borderRadius:11, alignItems:"center", justifyContent:"center" },
  sellerActionTxt: { fontSize:14, fontWeight:"700", flex:1 },
  msgBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:50, borderRadius:16, backgroundColor:"#F3F4F6", marginBottom:10 },
  msgBtnTxt: { fontSize:14, fontWeight:"700", color:"#374151" },
  backdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center" },
  confirmSheet: { backgroundColor:"#fff", borderRadius:24, padding:24, width:"82%", alignItems:"center", gap:8 },
  confirmIconWrap: { width:56, height:56, borderRadius:28, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center", marginBottom:4 },
  confirmTitle: { fontSize:18, fontWeight:"900", color:"#111827" },
  confirmSub: { fontSize:13, color:"#374151", textAlign:"center", fontWeight:"600" },
  confirmRef: { fontSize:11, color:"#9CA3AF" },
  confirmBtns: { flexDirection:"row", gap:12, marginTop:10, width:"100%" },
  confirmCancelBtn: { flex:1, height:46, borderRadius:14, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  confirmCancelTxt: { fontSize:14, fontWeight:"700", color:"#374151" },
  confirmOkBtn: { flex:1, height:46, borderRadius:14, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  confirmOkTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
});
