// app/comments.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, TextInput, KeyboardAvoidingView,
  Platform, Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_POST = {
  id: "p1",
  author: "Ada Okonkwo",
  handle: "ada_okonkwo",
  initials: "AO",
  avatarBg: "#DCFCE7",
  avatarColor: "#15803D",
  body: "HP 65W USB-C Charger — barely used, compatible with most laptops. Great condition. DM to buy! 🔌",
  time: "2h ago",
  likes: 32,
  type: "listing", // "listing" | "post"
};

const INITIAL_COMMENTS = [
  {
    id: "c1",
    author: "Emeka Balogun",
    handle: "emeka.b",
    initials: "EB",
    avatarBg: "#FEF9C3",
    avatarColor: "#854D0E",
    body: "Is this still available? I need one urgently for my HP Spectre.",
    time: "1h ago",
    likes: 4,
    likedByMe: false,
    isPremium: false,
    isMe: false,
    replies: [
      {
        id: "r1",
        author: "Ada Okonkwo",
        handle: "ada_okonkwo",
        initials: "AO",
        avatarBg: "#DCFCE7",
        avatarColor: "#15803D",
        body: "Yes! Still available, DM me 🙂",
        time: "58m ago",
        likes: 2,
        likedByMe: false,
        isPremium: true,
        isMe: true,
      },
    ],
  },
  {
    id: "c2",
    author: "Ngozi Aliyu",
    handle: "ngozi.alli",
    initials: "NA",
    avatarBg: "#F0F9FF",
    avatarColor: "#0369A1",
    body: "What's your last price? Any wiggle room from the ₦6,000?",
    time: "45m ago",
    likes: 1,
    likedByMe: true,
    isPremium: false,
    isMe: false,
    replies: [],
  },
  {
    id: "c3",
    author: "Chukwudi Eze",
    handle: "chuks_",
    initials: "CE",
    avatarBg: "#EDE9FE",
    avatarColor: "#4C1D95",
    body: "I bought from Ada last semester — great seller, fast delivery 🔥",
    time: "30m ago",
    likes: 7,
    likedByMe: false,
    isPremium: true,
    isMe: false,
    replies: [],
  },
  {
    id: "c4",
    author: "Fatima Yusuf",
    handle: "fatimay",
    initials: "FY",
    avatarBg: "#FCE7F3",
    avatarColor: "#9D174D",
    body: "Does it come with the original box?",
    time: "15m ago",
    likes: 0,
    likedByMe: false,
    isPremium: false,
    isMe: false,
    replies: [],
  },
];

// Mock: current user is premium (can edit/delete own comments)
const CURRENT_USER = {
  name: "Ada Okonkwo",
  handle: "ada_okonkwo",
  initials: "AO",
  avatarBg: "#DCFCE7",
  avatarColor: "#15803D",
  isPremium: true,
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const Avatar = ({ initials, bg, color, size = 36 }) => (
  <View style={[av.wrap, { width:size, height:size, borderRadius:size/2, backgroundColor:bg }]}>
    <Text style={[av.txt, { color, fontSize: size * 0.38 }]}>{initials}</Text>
  </View>
);
const av = StyleSheet.create({
  wrap: { alignItems:"center", justifyContent:"center" },
  txt:  { fontWeight:"800" },
});

// ─── REPLY CARD ──────────────────────────────────────────────────────────────
const ReplyCard = ({ reply, onLike, onReport }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(fa, { toValue:1, duration:250, useNativeDriver:true }).start();
  }, []);

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue:1.3, useNativeDriver:true, damping:8 }),
      Animated.spring(scale, { toValue:1,   useNativeDriver:true, damping:12 }),
    ]).start();
    onLike(reply.id, true);
  };

  return (
    <Animated.View style={[s.replyCard, { opacity:fa }]}>
      <Avatar initials={reply.initials} bg={reply.avatarBg} color={reply.avatarColor} size={28} />
      <View style={{ flex:1 }}>
        <View style={s.commentHeader}>
          <Text style={s.commentAuthor}>{reply.author}</Text>
          {reply.isPremium && (
            <View style={s.premiumBadge}>
              <Ionicons name="sparkles" size={8} color="#F97316" />
              <Text style={s.premiumBadgeTxt}>PRO</Text>
            </View>
          )}
          <Text style={s.commentTime}>{reply.time}</Text>
        </View>
        <Text style={s.commentBody}>{reply.body}</Text>
        <View style={s.commentActions}>
          <TouchableOpacity style={s.likeBtn} onPress={handleLike}>
            <Animated.View style={{ transform:[{scale}] }}>
              <Ionicons name={reply.likedByMe ? "heart" : "heart-outline"} size={13} color={reply.likedByMe ? "#EF4444" : "#9CA3AF"} />
            </Animated.View>
            {reply.likes > 0 && <Text style={[s.likeTxt, reply.likedByMe && { color:"#EF4444" }]}>{reply.likes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onReport(reply)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name="flag-outline" size={12} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── COMMENT CARD ────────────────────────────────────────────────────────────
const CommentCard = ({ comment, index, onLike, onReply, onEdit, onDelete, onReport }) => {
  const fa    = useRef(new Animated.Value(0)).current;
  const sa    = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu,    setShowMenu]    = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:300, delay:index*45, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:300, delay:index*45, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue:1.35, useNativeDriver:true, damping:8 }),
      Animated.spring(scale, { toValue:1,    useNativeDriver:true, damping:12 }),
    ]).start();
    onLike(comment.id, false);
  };

  const canManage = comment.isMe && CURRENT_USER.isPremium;

  return (
    <Animated.View style={[s.commentCard, { opacity:fa, transform:[{translateY:sa}] }]}>
      <Avatar initials={comment.initials} bg={comment.avatarBg} color={comment.avatarColor} size={36} />
      <View style={{ flex:1 }}>
        {/* Header */}
        <View style={s.commentHeader}>
          <TouchableOpacity onPress={() => router.push(`/seller/${comment.handle}`)}>
            <Text style={s.commentAuthor}>{comment.author}</Text>
          </TouchableOpacity>
          {comment.isPremium && (
            <View style={s.premiumBadge}>
              <Ionicons name="sparkles" size={8} color="#F97316" />
              <Text style={s.premiumBadgeTxt}>PRO</Text>
            </View>
          )}
          <Text style={s.commentTime}>{comment.time}</Text>
          {/* Three-dot menu */}
          <View style={{ marginLeft:"auto" }}>
            <TouchableOpacity
              onPress={() => setShowMenu(v => !v)}
              hitSlop={{top:8,bottom:8,left:8,right:8}}
            >
              <Ionicons name="ellipsis-horizontal" size={14} color="#D1D5DB" />
            </TouchableOpacity>
            {showMenu && (
              <View style={s.commentMenu}>
                {canManage && (
                  <>
                    <TouchableOpacity style={s.commentMenuRow} onPress={() => { setShowMenu(false); onEdit(comment); }}>
                      <Ionicons name="create-outline" size={14} color="#374151" />
                      <Text style={s.commentMenuTxt}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.commentMenuRow} onPress={() => { setShowMenu(false); onDelete(comment.id); }}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={[s.commentMenuTxt, { color:"#EF4444" }]}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
                {!comment.isMe && (
                  <TouchableOpacity style={[s.commentMenuRow, { borderBottomWidth:0 }]} onPress={() => { setShowMenu(false); onReport(comment); }}>
                    <Ionicons name="flag-outline" size={14} color="#EF4444" />
                    <Text style={[s.commentMenuTxt, { color:"#EF4444" }]}>Report</Text>
                  </TouchableOpacity>
                )}
                {comment.isMe && (
                  <TouchableOpacity style={[s.commentMenuRow, { borderBottomWidth:0 }]} onPress={() => setShowMenu(false)}>
                    <Ionicons name="close-outline" size={14} color="#9CA3AF" />
                    <Text style={[s.commentMenuTxt, { color:"#9CA3AF" }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <Text style={s.commentBody}>{comment.body}</Text>

        {/* Actions */}
        <View style={s.commentActions}>
          <TouchableOpacity style={s.likeBtn} onPress={handleLike}>
            <Animated.View style={{ transform:[{scale}] }}>
              <Ionicons name={comment.likedByMe ? "heart" : "heart-outline"} size={14} color={comment.likedByMe ? "#EF4444" : "#9CA3AF"} />
            </Animated.View>
            {comment.likes > 0 && <Text style={[s.likeTxt, comment.likedByMe && { color:"#EF4444" }]}>{comment.likes}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.replyTrigger} onPress={() => onReply(comment)}>
            <Ionicons name="return-down-forward-outline" size={13} color="#9CA3AF" />
            <Text style={s.replyTriggerTxt}>Reply</Text>
          </TouchableOpacity>
          {comment.replies.length > 0 && (
            <TouchableOpacity onPress={() => setShowReplies(v => !v)}>
              <Text style={s.toggleReplies}>
                {showReplies ? "Hide" : `View ${comment.replies.length}`} {comment.replies.length === 1 ? "reply" : "replies"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies */}
        {showReplies && comment.replies.map(reply => (
          <ReplyCard key={reply.id} reply={reply} onLike={(id) => onLike(id, true, comment.id)} onReport={onReport} />
        ))}
      </View>
    </Animated.View>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Comments() {
  const { id, type } = useLocalSearchParams();
  const post = MOCK_POST;

  const [comments,      setComments]      = useState(INITIAL_COMMENTS);
  const [inputText,     setInputText]     = useState("");
  const [replyingTo,    setReplyingTo]    = useState(null); // { id, author }
  const [editingId,     setEditingId]     = useState(null);
  const [reportTarget,  setReportTarget]  = useState(null);
  const [reported,      setReported]      = useState(false);

  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:350, useNativeDriver:true }).start();
  }, []);

  // ── Like ──
  const handleLike = useCallback((targetId, isReply, parentId) => {
    setComments(prev => prev.map(c => {
      if (!isReply && c.id === targetId) {
        return { ...c, likedByMe: !c.likedByMe, likes: c.likedByMe ? c.likes - 1 : c.likes + 1 };
      }
      if (isReply && c.id === parentId) {
        return {
          ...c,
          replies: c.replies.map(r =>
            r.id === targetId
              ? { ...r, likedByMe: !r.likedByMe, likes: r.likedByMe ? r.likes - 1 : r.likes + 1 }
              : r
          ),
        };
      }
      return c;
    }));
  }, []);

  // ── Reply ──
  const handleReply = useCallback((comment) => {
    setReplyingTo({ id: comment.id, author: comment.author });
    setEditingId(null);
    setInputText(`@${comment.handle} `);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Edit ──
  const handleEdit = useCallback((comment) => {
    setEditingId(comment.id);
    setReplyingTo(null);
    setInputText(comment.body);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Delete ──
  const handleDelete = useCallback((id) => {
    setComments(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Submit ──
  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text) return;

    if (editingId) {
      // Edit existing comment
      setComments(prev => prev.map(c =>
        c.id === editingId ? { ...c, body: text, time: "just now (edited)" } : c
      ));
      setEditingId(null);
    } else if (replyingTo) {
      // Add reply
      const newReply = {
        id: `r${Date.now()}`,
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        initials: CURRENT_USER.initials,
        avatarBg: CURRENT_USER.avatarBg,
        avatarColor: CURRENT_USER.avatarColor,
        body: text,
        time: "just now",
        likes: 0,
        likedByMe: false,
        isPremium: CURRENT_USER.isPremium,
        isMe: true,
      };
      setComments(prev => prev.map(c =>
        c.id === replyingTo.id ? { ...c, replies: [...c.replies, newReply] } : c
      ));
      setReplyingTo(null);
    } else {
      // New top-level comment
      const newComment = {
        id: `c${Date.now()}`,
        author: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        initials: CURRENT_USER.initials,
        avatarBg: CURRENT_USER.avatarBg,
        avatarColor: CURRENT_USER.avatarColor,
        body: text,
        time: "just now",
        likes: 0,
        likedByMe: false,
        isPremium: CURRENT_USER.isPremium,
        isMe: true,
        replies: [],
      };
      setComments(prev => [...prev, newComment]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated:true }), 100);
    }

    setInputText("");
  };

  const cancelInput = () => {
    setInputText("");
    setReplyingTo(null);
    setEditingId(null);
    inputRef.current?.blur();
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Comments</Text>
          <View style={s.countPill}>
            <Text style={s.countTxt}>{totalComments}</Text>
          </View>
        </View>
        <View style={{ width:24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>

        <Animated.View style={{ flex:1, opacity:fadeAnim }}>
          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={c => c.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom:20 }}
            ListHeaderComponent={
              <View>
                {/* Original post preview */}
                <View style={s.postPreview}>
                  <Avatar initials={post.initials} bg={post.avatarBg} color={post.avatarColor} size={38} />
                  <View style={{ flex:1 }}>
                    <View style={s.commentHeader}>
                      <Text style={s.commentAuthor}>{post.author}</Text>
                      <Text style={s.commentTime}>{post.time}</Text>
                    </View>
                    <Text style={s.postBody} numberOfLines={3}>{post.body}</Text>
                  </View>
                </View>
                <View style={s.divider} />
                <Text style={s.commentsLabel}>
                  {totalComments} {totalComments === 1 ? "comment" : "comments"}
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <CommentCard
                comment={item}
                index={index}
                onLike={handleLike}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={setReportTarget}
              />
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="chatbubbles-outline" size={44} color="#E5E7EB" />
                <Text style={s.emptyTitle}>No comments yet</Text>
                <Text style={s.emptySub}>Be the first to say something</Text>
              </View>
            }
          />
        </Animated.View>

        {/* Input bar */}
        <View style={s.inputArea}>
          {/* Reply / edit context strip */}
          {(replyingTo || editingId) && (
            <View style={s.contextStrip}>
              <Ionicons
                name={editingId ? "create-outline" : "return-down-forward-outline"}
                size={14}
                color="#F97316"
              />
              <Text style={s.contextTxt} numberOfLines={1}>
                {editingId ? "Editing comment" : `Replying to ${replyingTo?.author}`}
              </Text>
              <TouchableOpacity onPress={cancelInput} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Ionicons name="close" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            <Avatar
              initials={CURRENT_USER.initials}
              bg={CURRENT_USER.avatarBg}
              color={CURRENT_USER.avatarColor}
              size={32}
            />
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder={replyingTo ? `Reply to ${replyingTo.author}…` : "Write a comment…"}
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}
              onPress={handleSubmit}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name={editingId ? "checkmark" : "send"}
                size={16}
                color={inputText.trim() ? "#fff" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Report modal */}
      <Modal transparent visible={!!reportTarget} animationType="slide" onRequestClose={() => { setReportTarget(null); setReported(false); }}>
        <TouchableOpacity style={s.reportBackdrop} activeOpacity={1} onPress={() => { setReportTarget(null); setReported(false); }} />
        <View style={s.reportSheet}>
          {reported ? (
            <View style={s.reportedWrap}>
              <Ionicons name="checkmark-circle" size={44} color="#15803D" />
              <Text style={s.reportedTitle}>Reported</Text>
              <Text style={s.reportedSub}>Thanks — our team will review this comment.</Text>
              <TouchableOpacity style={s.reportDoneBtn} onPress={() => { setReportTarget(null); setReported(false); }}>
                <Text style={s.reportDoneTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.reportTitle}>Report comment</Text>
              <Text style={s.reportSub}>Why are you reporting this?</Text>
              {[
                "Spam or misleading",
                "Harassment or bullying",
                "Inappropriate content",
                "Scam or fraud",
                "Other",
              ].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={s.reportOption}
                  onPress={() => setReported(true)}
                >
                  <Text style={s.reportOptionTxt}>{reason}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerCenter: { flexDirection:"row", alignItems:"center", gap:8 },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  countPill: { backgroundColor:"#F97316", borderRadius:10, minWidth:20, height:20, alignItems:"center", justifyContent:"center", paddingHorizontal:6 },
  countTxt: { fontSize:11, fontWeight:"900", color:"#fff" },

  // Post preview
  postPreview: { flexDirection:"row", gap:12, padding:16, paddingBottom:14 },
  postBody: { fontSize:13, color:"#374151", lineHeight:19, marginTop:3 },
  divider: { height:1, backgroundColor:"#F3F4F6", marginHorizontal:16 },
  commentsLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", paddingHorizontal:16, paddingVertical:12 },

  // Comment card
  commentCard: { flexDirection:"row", gap:10, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  commentHeader: { flexDirection:"row", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" },
  commentAuthor: { fontSize:13, fontWeight:"800", color:"#111827" },
  commentTime: { fontSize:11, color:"#9CA3AF" },
  commentBody: { fontSize:14, color:"#374151", lineHeight:20, marginBottom:8 },
  commentActions: { flexDirection:"row", alignItems:"center", gap:16 },
  likeBtn: { flexDirection:"row", alignItems:"center", gap:4 },
  likeTxt: { fontSize:12, color:"#9CA3AF", fontWeight:"600" },
  replyTrigger: { flexDirection:"row", alignItems:"center", gap:4 },
  replyTriggerTxt: { fontSize:12, color:"#9CA3AF", fontWeight:"600" },
  toggleReplies: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },

  // Premium badge
  premiumBadge: { flexDirection:"row", alignItems:"center", gap:3, backgroundColor:"#FFF7ED", paddingHorizontal:5, paddingVertical:2, borderRadius:6 },
  premiumBadgeTxt: { fontSize:8, fontWeight:"900", color:"#F97316", letterSpacing:0.5 },

  // Three-dot menu
  commentMenu: { position:"absolute", top:20, right:0, backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:10, elevation:12, zIndex:100, minWidth:140 },
  commentMenuRow: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:11, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  commentMenuTxt: { fontSize:13, fontWeight:"600", color:"#374151" },

  // Reply card
  replyCard: { flexDirection:"row", gap:8, marginTop:10, paddingLeft:4, paddingTop:10, borderTopWidth:1, borderTopColor:"#F9FAFB" },

  // Input
  inputArea: { borderTopWidth:1, borderTopColor:"#F3F4F6", backgroundColor:"#fff", paddingBottom:Platform.OS === "ios" ? 20 : 12 },
  contextStrip: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:16, paddingVertical:8, backgroundColor:"#FFF7ED", borderBottomWidth:1, borderBottomColor:"#FED7AA" },
  contextTxt: { flex:1, fontSize:12, color:"#F97316", fontWeight:"600" },
  inputRow: { flexDirection:"row", alignItems:"flex-end", gap:10, paddingHorizontal:14, paddingTop:10 },
  input: { flex:1, fontSize:14, color:"#111827", backgroundColor:"#F3F4F6", borderRadius:20, paddingHorizontal:14, paddingVertical:10, maxHeight:100, lineHeight:20 },
  sendBtn: { width:38, height:38, borderRadius:19, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", marginBottom:1 },
  sendBtnDisabled: { backgroundColor:"#F3F4F6" },

  // Empty
  empty: { alignItems:"center", paddingTop:48, gap:10 },
  emptyTitle: { fontSize:16, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF" },

  // Report
  reportBackdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.35)" },
  reportSheet: { backgroundColor:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:Platform.OS === "ios" ? 36 : 24 },
  reportTitle: { fontSize:17, fontWeight:"900", color:"#111827", marginBottom:4 },
  reportSub: { fontSize:13, color:"#9CA3AF", marginBottom:16 },
  reportOption: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  reportOptionTxt: { fontSize:14, color:"#374151", fontWeight:"500" },
  reportedWrap: { alignItems:"center", paddingVertical:20, gap:12 },
  reportedTitle: { fontSize:20, fontWeight:"900", color:"#111827" },
  reportedSub: { fontSize:13, color:"#6B7280", textAlign:"center" },
  reportDoneBtn: { marginTop:8, paddingHorizontal:28, paddingVertical:12, borderRadius:16, backgroundColor:"#1E3A8A" },
  reportDoneTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
});
