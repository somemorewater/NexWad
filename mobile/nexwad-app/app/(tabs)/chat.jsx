// app/chat/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CONTACTS = {
  m1: { name:"Emeka Balogun",  initials:"EB", bg:"#FEF9C3", color:"#854D0E", dept:"EEE 400L",  online:true,  listing:{ title:"HP 65W USB-C Charger",  price:"₦6,000",  imgBg:"#FEF9C3", imgIcon:"flash-outline",      imgColor:"#854D0E" } },
  m2: { name:"Fatima Yusuf",   initials:"FY", bg:"#FCE7F3", color:"#9D174D", dept:"MEC 200L",  online:true,  listing:{ title:"Jollof Rice + Protein",  price:"₦800",    imgBg:"#FEF3C7", imgIcon:"restaurant-outline", imgColor:"#B45309" } },
  m3: { name:"Chukwudi Eze",   initials:"CE", bg:"#EDE9FE", color:"#4C1D95", dept:"CVE 300L",  online:false, listing:{ title:"AutoCAD Tutoring",        price:"₦3,000",  imgBg:"#EDE9FE", imgIcon:"desktop-outline",    imgColor:"#4C1D95" } },
  m4: { name:"Ngozi Alli",     initials:"NA", bg:"#F0F9FF", color:"#0369A1", dept:"MBA 100L",  online:false, listing:null },
  m5: { name:"Ada Okonkwo",    initials:"AO", bg:"#DCFCE7", color:"#15803D", dept:"CSC 300L",  online:false, listing:{ title:"Stroud Maths 7th Ed",     price:"₦4,500",  imgBg:"#DBEAFE", imgIcon:"book-outline",       imgColor:"#1E3A8A" } },
};
const DEFAULT_CONTACT = CONTACTS.m1;

const BASE_MSGS = {
  m1: [
    { id:"b1", from:"them", text:"Hi! Is the HP charger still available?",        time:"10:21 AM", read:true  },
    { id:"b2", from:"me",   text:"Yes it is! Still in great condition.",           time:"10:23 AM", read:true  },
    { id:"b3", from:"them", text:"Cool. Can I come pick it up today?",             time:"10:24 AM", read:true  },
    { id:"b4", from:"me",   text:"Sure! I'm around campus all day. Just DM me when you're close.", time:"10:25 AM", read:true },
    { id:"b5", from:"them", text:"Perfect. Around 2pm work for you?",             time:"10:26 AM", read:true  },
    { id:"b6", from:"me",   text:"Yes that works 👍",                              time:"10:27 AM", read:true  },
  ],
  m2: [
    { id:"b1", from:"them", text:"Is the textbook still available?",               time:"9:14 AM",  read:true  },
    { id:"b2", from:"me",   text:"Yes! Which one were you asking about?",          time:"9:15 AM",  read:true  },
    { id:"b3", from:"them", text:"Order confirmed! Come by Block C at 1pm.",       time:"9:40 AM",  read:false },
  ],
  m3: [
    { id:"b1", from:"me",   text:"Hey, are you still offering AutoCAD tutoring?", time:"Yesterday",read:true  },
    { id:"b2", from:"them", text:"Yes! Weekends, 2hrs per session. ₦3,000.",       time:"Yesterday",read:true  },
    { id:"b3", from:"me",   text:"How many sessions do you need?",                 time:"Yesterday",read:true  },
  ],
};
const DEFAULT_MSGS = BASE_MSGS.m1;

const QUICK_REPLIES = [
  "Is this still available?",
  "Can we meet on campus?",
  "What's your final price?",
  "I'll take it!",
];

const Bubble = ({ msg, contact }) => {
  const isMe = msg.from === "me";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isMe ? 10 : -10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:220, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:220, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      B.row,
      isMe ? B.rowMe : B.rowThem,
      { opacity:fadeAnim, transform:[{translateX:slideAnim}] },
    ]}>
      {!isMe && (
        <View style={[B.avatar, { backgroundColor:contact.bg }]}>
          <Text style={[B.avatarTxt, { color:contact.color }]}>{contact.initials}</Text>
        </View>
      )}
      <View style={[B.bubble, isMe ? B.bubbleMe : B.bubbleThem]}>
        <Text style={[B.text, isMe ? B.textMe : B.textThem]}>{msg.text}</Text>
        <View style={B.meta}>
          <Text style={[B.time, isMe && { color:"rgba(255,255,255,0.65)" }]}>{msg.time}</Text>
          {isMe && (
            <Ionicons
              name={msg.read ? "checkmark-done" : "checkmark"}
              size={12}
              color={msg.read ? "#93C5FD" : "rgba(255,255,255,0.65)"}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
};
const B = StyleSheet.create({
  row: { flexDirection:"row", alignItems:"flex-end", gap:8, marginBottom:10, paddingHorizontal:16 },
  rowMe: { justifyContent:"flex-end" },
  rowThem: { justifyContent:"flex-start" },
  avatar: { width:28, height:28, borderRadius:14, alignItems:"center", justifyContent:"center", marginBottom:2 },
  avatarTxt: { fontSize:9, fontWeight:"800" },
  bubble: { maxWidth:"75%", paddingHorizontal:14, paddingVertical:10, borderRadius:20 },
  bubbleMe: { backgroundColor:"#1E3A8A", borderBottomRightRadius:4 },
  bubbleThem: { backgroundColor:"#F3F4F6", borderBottomLeftRadius:4 },
  text: { fontSize:14, lineHeight:20 },
  textMe: { color:"#fff" },
  textThem: { color:"#111827" },
  meta: { flexDirection:"row", alignItems:"center", gap:3, marginTop:4, justifyContent:"flex-end" },
  time: { fontSize:10, color:"#9CA3AF" },
});

export default function Chat() {
  const { id } = useLocalSearchParams();
  const contact = CONTACTS[id] || DEFAULT_CONTACT;
  const [messages, setMessages] = useState(BASE_MSGS[id] || DEFAULT_MSGS);
  const [text,     setText]     = useState("");
  const [typing,   setTyping]   = useState(false);
  const listRef = useRef(null);
  const typingDots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue:1, duration:400, useNativeDriver:true }).start();
    // animate typing dots
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue:1, duration:400, delay, useNativeDriver:true }),
          Animated.timing(dot, { toValue:0, duration:400, useNativeDriver:true }),
        ])
      ).start();
    };
    typingDots.forEach((dot, i) => animateDot(dot, i * 160));
  }, []);

  const sendMessage = (msg = text.trim()) => {
    if (!msg) return;
    const newMsg = { id:`m${Date.now()}`, from:"me", text:msg, time:"Now", read:false };
    setMessages(prev => [...prev, newMsg]);
    setText("");
    setTimeout(() => setTyping(true), 600);
    setTimeout(() => {
      setTyping(false);
      const reply = { id:`r${Date.now()}`, from:"them", text:"Got it! Talk soon 👍", time:"Now", read:true };
      setMessages(prev => [...prev, reply]);
    }, 2400);
    setTimeout(() => listRef.current?.scrollToEnd({ animated:true }), 100);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <Animated.View style={[s.header, { opacity:headerFade }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerCenter} onPress={() => router.push(`/seller/${id}`)}>
          <View style={s.headerAvatarWrap}>
            <View style={[s.headerAvatar, { backgroundColor:contact.bg }]}>
              <Text style={[s.headerAvatarTxt, { color:contact.color }]}>{contact.initials}</Text>
            </View>
            {contact.online && <View style={s.onlineDot} />}
          </View>
          <View>
            <Text style={s.headerName}>{contact.name}</Text>
            <Text style={s.headerSub}>{contact.online ? "Online now" : contact.dept}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn} onPress={() => {}}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#374151" />
        </TouchableOpacity>
      </Animated.View>

      {/* Listing reference card */}
      {contact.listing && (
        <TouchableOpacity style={s.listingRef} onPress={() => router.push("/listing/1")}>
          <View style={[s.listingRefImg, { backgroundColor:contact.listing.imgBg }]}>
            <Ionicons name={contact.listing.imgIcon} size={16} color={contact.listing.imgColor} style={{ opacity:0.6 }} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.listingRefLabel}>Discussing listing</Text>
            <Text style={s.listingRefTitle} numberOfLines={1}>{contact.listing.title}</Text>
          </View>
          <Text style={s.listingRefPrice}>{contact.listing.price}</Text>
          <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={{ flex:1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop:16, paddingBottom:8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated:false })}
          renderItem={({ item }) => <Bubble msg={item} contact={contact} />}
          ListFooterComponent={
            typing ? (
              <View style={s.typingRow}>
                <View style={[B.avatar, { backgroundColor:contact.bg }]}>
                  <Text style={[B.avatarTxt, { color:contact.color }]}>{contact.initials}</Text>
                </View>
                <View style={s.typingBubble}>
                  {typingDots.map((dot, i) => (
                    <Animated.View key={i} style={[s.typingDot, {
                      transform:[{ translateY: dot.interpolate({ inputRange:[0,1], outputRange:[0,-4] }) }]
                    }]} />
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick replies */}
        {text.length === 0 && (
          <FlatList
            horizontal
            data={QUICK_REPLIES}
            keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal:14, gap:8, paddingVertical:8 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.quickReply} onPress={() => sendMessage(item)}>
                <Text style={s.quickReplyTxt}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TouchableOpacity style={s.attachBtn}>
            <Ionicons name="attach-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="Type a message…"
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          {text.trim().length > 0 ? (
            <TouchableOpacity style={s.sendBtn} onPress={() => sendMessage()}>
              <Ionicons name="send" size={17} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.attachBtn}>
              <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", paddingHorizontal:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#F3F4F6", gap:8 },
  headerCenter: { flex:1, flexDirection:"row", alignItems:"center", gap:10 },
  headerAvatarWrap: { position:"relative" },
  headerAvatar: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  headerAvatarTxt: { fontSize:13, fontWeight:"800" },
  onlineDot: { position:"absolute", bottom:0, right:0, width:11, height:11, borderRadius:6, backgroundColor:"#22C55E", borderWidth:2, borderColor:"#fff" },
  headerName: { fontSize:14, fontWeight:"700", color:"#111827" },
  headerSub: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  headerBtn: { padding:6 },
  listingRef: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:10, backgroundColor:"#F9FAFB", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  listingRefImg: { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center" },
  listingRefLabel: { fontSize:9, fontWeight:"700", color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5, marginBottom:1 },
  listingRefTitle: { fontSize:12, fontWeight:"700", color:"#111827" },
  listingRefPrice: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  typingRow: { flexDirection:"row", alignItems:"flex-end", gap:8, paddingHorizontal:16, marginBottom:10 },
  typingBubble: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#F3F4F6", paddingHorizontal:14, paddingVertical:12, borderRadius:20, borderBottomLeftRadius:4 },
  typingDot: { width:7, height:7, borderRadius:4, backgroundColor:"#9CA3AF" },
  quickReply: { backgroundColor:"#F3F4F6", paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:"#E5E7EB" },
  quickReplyTxt: { fontSize:12, fontWeight:"600", color:"#374151" },
  inputBar: { flexDirection:"row", alignItems:"flex-end", paddingHorizontal:12, paddingVertical:10, paddingBottom:Platform.OS==="ios"?24:10, gap:8, borderTopWidth:1, borderTopColor:"#F3F4F6", backgroundColor:"#fff" },
  attachBtn: { width:38, height:38, alignItems:"center", justifyContent:"center" },
  input: { flex:1, minHeight:38, maxHeight:100, backgroundColor:"#F3F4F6", borderRadius:20, paddingHorizontal:14, paddingTop:9, paddingBottom:9, fontSize:14, color:"#111827" },
  sendBtn: { width:38, height:38, borderRadius:19, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6, elevation:6 },
});
