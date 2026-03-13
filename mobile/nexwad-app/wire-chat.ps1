# Wire chat-[id].jsx to real API
# Run from: C:\Users\DARAKU\Desktop\NEX_WAD\nexwad-app

Write-Host "Wiring chat-[id].jsx..." -ForegroundColor Cyan

$newContent = @'
// app/(tabs)/chat-[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api, { subscribeToMessages } from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";

export default function Chat() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const flatRef = useRef(null);

  const [contact,  setContact]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  // Load conversation + messages
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { messages: msgs, conversation } = await api.conversations.messages(id);
        setMessages(msgs || []);

        // Get the other participant
        const other = conversation?.participants?.find(p => p.id !== user?.id);
        if (other) {
          setContact({
            name:     other.name || "User",
            initials: (other.name || "U").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase(),
            bg:       "#DBEAFE",
            color:    "#1E3A8A",
            dept:     other.dept || "",
            online:   false,
            handle:   other.username || "",
          });
        }
      } catch (err) {
        console.log("[chat load]", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Subscribe to realtime messages
    const unsub = subscribeToMessages(id, (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, {
          id:   newMsg.id,
          from: newMsg.sender_id === user?.id ? "me" : "them",
          text: newMsg.content,
          time: new Date(newMsg.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
          read: false,
        }];
      });
    });

    return () => { if (unsub) unsub(); };
  }, [id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id:   "temp-" + Date.now(),
      from: "me",
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.conversations.send(id, msgText);
    } catch (err) {
      console.log("[send msg]", err.message);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.from === "me" || item.sender_id === user?.id;
    return (
      <View style={[ms.row, isMe && ms.rowMe]}>
        {!isMe && (
          <View style={[ms.avatar, { backgroundColor: contact?.bg || "#DBEAFE" }]}>
            <Text style={[ms.avatarTxt, { color: contact?.color || "#1E3A8A" }]}>
              {contact?.initials || "?"}
            </Text>
          </View>
        )}
        <View style={[ms.bubble, isMe ? ms.bubbleMe : ms.bubbleThem]}>
          <Text style={[ms.bubbleTxt, isMe && ms.bubbleTxtMe]}>{item.text || item.content}</Text>
          <Text style={[ms.bubbleTime, isMe && ms.bubbleTimeMe]}>
            {item.time || new Date(item.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            {isMe && <Ionicons name={item.read ? "checkmark-done" : "checkmark"} size={11} color={isMe ? "rgba(255,255,255,0.7)" : "#9CA3AF"} />}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator style={{ flex:1 }} color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerCenter} onPress={() => contact && router.push(`/(tabs)/seller/${contact.handle}`)}>
          <View style={[s.headerAvatar, { backgroundColor: contact?.bg || "#DBEAFE" }]}>
            <Text style={[s.headerAvatarTxt, { color: contact?.color || "#1E3A8A" }]}>
              {contact?.initials || "?"}
            </Text>
          </View>
          <View>
            <Text style={s.headerName}>{contact?.name || "Chat"}</Text>
            <Text style={s.headerSub}>{contact?.online ? "Online" : contact?.dept || ""}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="ellipsis-vertical" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding:16, paddingBottom:8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems:"center", marginTop:60 }}>
              <Ionicons name="chatbubbles-outline" size={48} color="#E5E7EB" />
              <Text style={{ color:"#9CA3AF", marginTop:12, fontSize:14 }}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={s.inputBar}>
          <TouchableOpacity style={s.attachBtn}>
            <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ms = StyleSheet.create({
  row:          { flexDirection:"row", alignItems:"flex-end", marginBottom:12 },
  rowMe:        { flexDirection:"row-reverse" },
  avatar:       { width:28, height:28, borderRadius:14, alignItems:"center", justifyContent:"center", marginRight:6 },
  avatarTxt:    { fontSize:11, fontWeight:"700" },
  bubble:       { maxWidth:"75%", borderRadius:18, paddingHorizontal:14, paddingVertical:8 },
  bubbleMe:     { backgroundColor:"#1E3A8A", borderBottomRightRadius:4 },
  bubbleThem:   { backgroundColor:"#F3F4F6", borderBottomLeftRadius:4 },
  bubbleTxt:    { fontSize:14, color:"#111827", lineHeight:20 },
  bubbleTxtMe:  { color:"#fff" },
  bubbleTime:   { fontSize:10, color:"#9CA3AF", marginTop:4, textAlign:"right" },
  bubbleTimeMe: { color:"rgba(255,255,255,0.6)" },
});

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:"#fff" },
  header:         { flexDirection:"row", alignItems:"center", paddingHorizontal:12, paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#F3F4F6", gap:10 },
  headerCenter:   { flex:1, flexDirection:"row", alignItems:"center", gap:10 },
  headerAvatar:   { width:38, height:38, borderRadius:19, alignItems:"center", justifyContent:"center" },
  headerAvatarTxt:{ fontSize:13, fontWeight:"700" },
  headerName:     { fontSize:15, fontWeight:"700", color:"#111827" },
  headerSub:      { fontSize:12, color:"#6B7280" },
  inputBar:       { flexDirection:"row", alignItems:"flex-end", paddingHorizontal:12, paddingVertical:8, borderTopWidth:1, borderTopColor:"#F3F4F6", gap:8, backgroundColor:"#fff" },
  attachBtn:      { paddingBottom:6 },
  input:          { flex:1, backgroundColor:"#F3F4F6", borderRadius:20, paddingHorizontal:14, paddingVertical:8, fontSize:14, color:"#111827", maxHeight:100 },
  sendBtn:        { width:36, height:36, borderRadius:18, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  sendBtnDisabled:{ backgroundColor:"#93C5FD" },
});
'@

$newContent | Set-Content -LiteralPath "app\(tabs)\chat-[id].jsx" -Encoding UTF8
Write-Host "chat-[id].jsx wired!" -ForegroundColor Green
