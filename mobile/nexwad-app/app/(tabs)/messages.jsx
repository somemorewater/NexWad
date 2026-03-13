// app/messages.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";

const CONVOS = [
  { id:"m1", name:"Emeka Balogun",  initials:"EB", bg:"#FEF9C3", color:"#854D0E", lastMsg:"Is the charger still available?",          time:"2m",  unread:2, online:true  },
  { id:"m2", name:"Fatima Yusuf",   initials:"FY", bg:"#FCE7F3", color:"#9D174D", lastMsg:"Order confirmed! Come by Block C at 1pm.", time:"15m", unread:0, online:true  },
  { id:"m3", name:"Chukwudi Eze",   initials:"CE", bg:"#EDE9FE", color:"#4C1D95", lastMsg:"How many sessions do you need?",           time:"1h",  unread:1, online:false },
  { id:"m4", name:"Ngozi Alli",     initials:"NA", bg:"#F0F9FF", color:"#0369A1", lastMsg:"Payment received, thanks!",                time:"3h",  unread:0, online:false },
  { id:"m5", name:"Ada Okonkwo",    initials:"AO", bg:"#DCFCE7", color:"#15803D", lastMsg:"Sure, I can hold it till tomorrow.",        time:"1d",  unread:0, online:false },
];

// Proper named component so hooks are valid
const ConvoItem = ({ item, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:300, delay:index*50, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:300, delay:index*50, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity
        style={s.convoRow}
     onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor:item.bg }]}>
            <Text style={[s.avatarTxt, { color:item.color }]}>{item.initials}</Text>
          </View>
          {item.online && <View style={s.onlineDot} />}
        </View>
        <View style={{ flex:1 }}>
          <View style={s.convoTop}>
            <Text style={[s.convoName, item.unread > 0 && { fontWeight:"800" }]}>{item.name}</Text>
            <Text style={s.convoTime}>{item.time}</Text>
          </View>
          <View style={s.convoBottom}>
            <Text
              style={[s.convoMsg, item.unread > 0 && { color:"#374151", fontWeight:"600" }]}
              numberOfLines={1}
            >
              {item.lastMsg}
            </Text>
            {item.unread > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadTxt}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Messages() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [convos, setConvos] = useState(CONVOS);
  const [loadingConvos, setLoadingConvos] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingConvos(true);
      try {
        const { conversations } = await api.conversations.list();
        if (conversations && conversations.length > 0) {
          const mapped = conversations.map(c => {
           const other = c.other || {};
            const name = other.name || "User";
            const initials = name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
            return {
              id: c.id,
              name,
              initials,
              bg: "#DBEAFE",
              color: "#1E3A8A",
              lastMsg: c.lastMessage?.content || "No messages yet",
              time: c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleDateString() : "",
              unread: c.unreadCount || 0,
              online: false,
            };
          });
          setConvos(mapped);
        }
      } catch (err) {
        console.log("[messages]", err.message);
      } finally {
        setLoadingConvos(false);
      }
    };
    load();
  }, []);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
  }, []);

  const filtered = convos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = convos.reduce((s, c) => s + c.unread, 0);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Messages</Text>
          {totalUnread > 0 && <View style={s.countPill}><Text style={s.countTxt}>{totalUnread}</Text></View>}
        </View>
        <TouchableOpacity style={s.composeBtn} onPress={() => router.push("/search")}>
          <Ionicons name="create-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          style={s.searchInput}
          placeholder="Search messages…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Animated.View style={{ flex:1, opacity:fadeAnim }}>
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <ConvoItem item={item} index={index} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No conversations yet</Text>
              <Text style={s.emptySub}>Message a seller to start chatting</Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerCenter: { flexDirection:"row", alignItems:"center", gap:8 },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  countPill: { backgroundColor:"#F97316", borderRadius:10, minWidth:20, height:20, alignItems:"center", justifyContent:"center", paddingHorizontal:6 },
  countTxt: { fontSize:11, fontWeight:"900", color:"#fff" },
  composeBtn: { padding:4 },
  searchWrap: { flexDirection:"row", alignItems:"center", gap:8, marginHorizontal:16, marginVertical:10, backgroundColor:"#F3F4F6", borderRadius:14, paddingHorizontal:12, height:42 },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  convoRow: { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, gap:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  avatarWrap: { position:"relative" },
  avatar: { width:48, height:48, borderRadius:24, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:15, fontWeight:"800" },
  onlineDot: { position:"absolute", bottom:1, right:1, width:12, height:12, borderRadius:6, backgroundColor:"#22C55E", borderWidth:2, borderColor:"#fff" },
  convoTop: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:3 },
  convoName: { fontSize:14, fontWeight:"600", color:"#111827" },
  convoTime: { fontSize:11, color:"#9CA3AF" },
  convoBottom: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  convoMsg: { flex:1, fontSize:13, color:"#9CA3AF", marginRight:8 },
  unreadBadge: { backgroundColor:"#F97316", borderRadius:10, minWidth:18, height:18, alignItems:"center", justifyContent:"center", paddingHorizontal:5 },
  unreadTxt: { fontSize:10, fontWeight:"800", color:"#fff" },
  empty: { alignItems:"center", justifyContent:"center", paddingTop:80, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF" },
});

