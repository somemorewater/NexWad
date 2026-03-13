// app/rate.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const QUICK_TAGS = [
  "Easy to use", "Great sellers", "Fast delivery", "Good prices",
  "Nice design", "Helpful support", "Needs improvement", "Love the community",
];

export default function Rate() {
  const [stars,     setStars]     = useState(0);
  const [hoveredStar, setHovered] = useState(0);
  const [tags,      setTags]      = useState([]);
  const [feedback,  setFeedback]  = useState("");
  const [submitted, setSubmitted] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const doneScale = useRef(new Animated.Value(0)).current;
  const starAnims = [0,1,2,3,4].map(() => useRef(new Animated.Value(1)).current);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleStar = (n) => {
    setStars(n);
    // Bounce animation for selected stars
    for (let i = 0; i < n; i++) {
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.spring(starAnims[i], { toValue:1.4, useNativeDriver:true, speed:80 }),
        Animated.spring(starAnims[i], { toValue:1,   useNativeDriver:true, speed:60 }),
      ]).start();
    }
  };

  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = () => {
    setSubmitted(true);
    Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
    setTimeout(() => router.back(), 2500);
  };

  const ratingLabel = ["", "Poor 😕", "Fair 😐", "Good 👍", "Great 😊", "Excellent 🌟"][stars] || "";
  const canSubmit = stars > 0;

  if (submitted) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Animated.View style={{ alignItems:"center", gap:16, transform:[{ scale: doneScale }] }}>
          <Text style={{ fontSize:72 }}>🌟</Text>
          <Text style={s.doneTitle}>Thanks for the feedback!</Text>
          <Text style={s.doneSub}>
            {stars >= 4
              ? "We're glad you're enjoying Nexwad. Your review helps us grow!"
              : "We'll work hard to make Nexwad better for you."}
          </Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name={i <= stars ? "star" : "star-outline"} size={28} color={i <= stars ? "#F59E0B" : "#E5E7EB"} />
            ))}
          </View>
        </Animated.View>
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
        <Text style={s.headerTitle}>Rate Nexwad</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.View style={[s.content, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoRow}>
            <Text style={s.logoNex}>NEX</Text>
            <Text style={s.logoWad}>WAD</Text>
          </View>
          <Text style={s.heroTxt}>How's your Nexwad experience?</Text>
          <Text style={s.heroSub}>Your rating helps fellow AFIT students find and trust our marketplace.</Text>
        </View>

        {/* Stars */}
        <View style={s.starsWrap}>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Animated.View key={i} style={{ transform:[{ scale: starAnims[i-1] }] }}>
                <TouchableOpacity
                  onPress={() => handleStar(i)}
                  activeOpacity={0.8}
                  hitSlop={{top:8,bottom:8,left:4,right:4}}
                >
                  <Ionicons
                    name={i <= (hoveredStar || stars) ? "star" : "star-outline"}
                    size={44}
                    color={i <= (hoveredStar || stars) ? "#F59E0B" : "#E5E7EB"}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          {stars > 0 && (
            <Animated.Text style={[s.ratingLabel, { opacity:fadeAnim }]}>
              {ratingLabel}
            </Animated.Text>
          )}
        </View>

        {/* Quick tags */}
        {stars > 0 && (
          <View style={s.tagsSection}>
            <Text style={s.tagsLabel}>What stood out? (optional)</Text>
            <View style={s.tagsGrid}>
              {QUICK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[s.tagChip, tags.includes(tag) && s.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  {tags.includes(tag) && <Ionicons name="checkmark" size={12} color="#fff" />}
                  <Text style={[s.tagTxt, tags.includes(tag) && s.tagTxtActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Written feedback */}
        {stars > 0 && (
          <View style={s.feedbackSection}>
            <Text style={s.tagsLabel}>Tell us more (optional)</Text>
            <TextInput
              style={s.feedbackInput}
              placeholder={stars >= 4 ? "What do you love most about Nexwad?" : "What can we improve?"}
              placeholderTextColor="#9CA3AF"
              multiline
              value={feedback}
              onChangeText={setFeedback}
              maxLength={300}
            />
            <Text style={s.charCount}>{feedback.length}/300</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
          onPress={() => canSubmit && handleSubmit()}
          activeOpacity={canSubmit ? 0.88 : 1}
        >
          <Ionicons name="star" size={16} color={canSubmit ? "#FCD34D" : "#9CA3AF"} />
          <Text style={[s.submitTxt, !canSubmit && { color:"#9CA3AF" }]}>Submit Rating</Text>
        </TouchableOpacity>

        {stars >= 5 && (
          <Text style={s.storeHint}>You can also rate us on the App Store / Play Store — it really helps! 🙏</Text>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },

  content: { flex:1, padding:20, gap:20 },

  hero: { alignItems:"center", gap:8, paddingTop:8 },
  logoRow: { flexDirection:"row", alignItems:"center" },
  logoNex: { fontSize:28, fontWeight:"900", color:"#1E3A8A", letterSpacing:-1 },
  logoWad: { fontSize:28, fontWeight:"900", color:"#F97316", letterSpacing:-1 },
  heroTxt: { fontSize:20, fontWeight:"900", color:"#111827", textAlign:"center" },
  heroSub: { fontSize:13, color:"#6B7280", textAlign:"center", lineHeight:20 },

  starsWrap: { alignItems:"center", gap:12 },
  starsRow: { flexDirection:"row", gap:8 },
  ratingLabel: { fontSize:16, fontWeight:"700", color:"#F59E0B" },

  tagsSection: { gap:10 },
  tagsLabel: { fontSize:12, fontWeight:"700", color:"#374151", textTransform:"uppercase", letterSpacing:0.5 },
  tagsGrid: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  tagChip: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"#F9FAFB" },
  tagChipActive: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  tagTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  tagTxtActive: { color:"#fff" },

  feedbackSection: { gap:8 },
  feedbackInput: { backgroundColor:"#F9FAFB", borderRadius:16, borderWidth:1.5, borderColor:"#E5E7EB", padding:14, fontSize:14, color:"#111827", minHeight:90, textAlignVertical:"top" },
  charCount: { fontSize:10, color:"#9CA3AF", textAlign:"right" },

  submitBtn: { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8, height:54, borderRadius:18, backgroundColor:"#1E3A8A", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.28, shadowRadius:14, elevation:10 },
  submitBtnDisabled: { backgroundColor:"#F3F4F6", shadowOpacity:0, elevation:0 },
  submitTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
  storeHint: { fontSize:12, color:"#9CA3AF", textAlign:"center", lineHeight:18 },

  doneTitle: { fontSize:22, fontWeight:"900", color:"#111827" },
  doneSub: { fontSize:14, color:"#6B7280", textAlign:"center", lineHeight:21, maxWidth:280 },
});
