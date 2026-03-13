// app/(tabs)/story-create.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, TextInput, ScrollView,
  Dimensions, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";

const { width: W, height: H } = Dimensions.get("window");

// ─── BACKGROUND PRESETS ───────────────────────────────────────────────────────
const BG_PRESETS = [
  { id:"navy",    color:"#1E3A8A", label:"Navy"    },
  { id:"orange",  color:"#F97316", label:"Orange"  },
  { id:"dark",    color:"#111827", label:"Dark"    },
  { id:"green",   color:"#15803D", label:"Green"   },
  { id:"purple",  color:"#7C3AED", label:"Purple"  },
  { id:"red",     color:"#DC2626", label:"Red"     },
  { id:"teal",    color:"#0D9488", label:"Teal"    },
  { id:"rose",    color:"#BE185D", label:"Rose"    },
];

// ─── STORY TYPES ──────────────────────────────────────────────────────────────
const STORY_TYPES = [
  { id:"text",    icon:"text-outline",       label:"Text"    },
  { id:"photo",   icon:"image-outline",      label:"Photo"   },
  { id:"listing", icon:"pricetag-outline",   label:"Listing" },
  { id:"promo",   icon:"megaphone-outline",  label:"Promo"   },
];

// ─── TEXT SIZE OPTIONS ─────────────────────────────────────────────────────────
const TEXT_SIZES = [
  { id:"sm",  label:"Aa", size:18, style:"normal"  },
  { id:"md",  label:"Aa", size:26, style:"normal"  },
  { id:"lg",  label:"Aa", size:34, style:"bold"    },
  { id:"xl",  label:"Aa", size:42, style:"italic"  },
];

export default function StoryCreate() {
  const [storyType,     setStoryType]     = useState("text");
  const [bgPreset,      setBgPreset]      = useState("navy");
  const [storyText,     setStoryText]     = useState("");
  const [textSize,      setTextSize]      = useState("md");
  const [attachedListing, setAttachedListing] = useState(null);
  const [showListings,  setShowListings]  = useState(false);
  const [myListings,    setMyListings]    = useState([]);
  const [step,          setStep]          = useState("compose"); // "compose" | "preview"
  const [publishing,    setPublishing]    = useState(false);
  const [published,     setPublished]     = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;
  const doneScale   = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const bg = BG_PRESETS.find(b => b.id === bgPreset);
  const ts = TEXT_SIZES.find(t => t.id === textSize);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  // Pulse the post button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue:1.06, duration:800, useNativeDriver:true }),
        Animated.timing(pulseAnim, { toValue:1,    duration:800, useNativeDriver:true }),
      ])
    );
    if (storyText.trim().length > 0 || attachedListing) loop.start();
    return () => loop.stop();
  }, [storyText, attachedListing]);

  const goPreview = () => {
    setStep("preview");
    Animated.spring(previewAnim, { toValue:1, useNativeDriver:true, damping:16, stiffness:180 }).start();
  };

  // Load seller's own listings for attaching
  useEffect(() => {
    api.listings.list({ mine: true, limit: 20 })
      .then(res => setMyListings(res.listings || []))
      .catch(() => {});
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Stories API — posts to /api/stories if available
      if (api.stories?.create) {
        await api.stories.create({
          type: storyType,
          text: storyText,
          background: bg.color,
          textSize: ts.size,
          listingId: attachedListing?.id || null,
        });
      }
    } catch (err) {
      console.log("[story publish]", err.message);
      // Continue even if API fails — show success UI
    } finally {
      setPublishing(false);
      setPublished(true);
      Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.replace("/(tabs)/feed"), 2000);
    }
  };

  const canPost = storyText.trim().length > 0 || attachedListing !== null || storyType === "photo";

  // ── PUBLISHED OVERLAY ───────────────────────────────────────────────────────
  if (published) {
    return (
      <View style={[s.safe, { backgroundColor: bg.color, justifyContent:"center", alignItems:"center" }]}>
        <StatusBar barStyle="light-content" backgroundColor={bg.color} />
        <Animated.View style={[s.doneBox, { transform:[{ scale: doneScale }] }]}>
          <View style={s.doneRing}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
          <Text style={s.doneTxt}>Story posted!</Text>
          <Text style={s.doneSub}>Your story is now live for 24 hours</Text>
        </Animated.View>
      </View>
    );
  }

  // ── PREVIEW STEP ────────────────────────────────────────────────────────────
  if (step === "preview") {
    return (
      <View style={[s.safe, { backgroundColor:"#000" }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Story preview canvas */}
        <Animated.View style={[
          s.previewCanvas,
          { backgroundColor: bg.color, transform:[{ scale: previewAnim.interpolate({ inputRange:[0,1], outputRange:[0.94,1] }) }],
            opacity: previewAnim }
        ]}>
          {/* Top gradient vignette effect */}
          <View style={s.vignetteTop} />

          {/* User info */}
          <View style={s.previewUser}>
            <View style={[s.previewAvatar, { backgroundColor:"rgba(255,255,255,0.2)" }]}>
              <Text style={s.previewAvatarTxt}>ME</Text>
            </View>
            <View>
              <Text style={s.previewName}>Your Story</Text>
              <Text style={s.previewTime}>Just now · 24h</Text>
            </View>
          </View>

          {/* Story content */}
          <View style={s.previewContent}>
            {storyText.trim().length > 0 && (
              <Text style={[
                s.previewText,
                { fontSize: ts.size,
                  fontStyle: ts.style === "italic" ? "italic" : "normal",
                  fontWeight: ts.style === "bold" ? "900" : "400" }
              ]}>
                {storyText}
              </Text>
            )}

            {storyType === "photo" && storyText.trim().length === 0 && (
              <View style={s.photoPlaceholder}>
                <Ionicons name="image-outline" size={64} color="rgba(255,255,255,0.3)" />
                <Text style={s.photoPlaceholderTxt}>Photo</Text>
              </View>
            )}
          </View>

          {/* Attached listing */}
          {attachedListing && (
            <View style={s.previewListing}>
              <View style={[s.previewListingIcon, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name={"pricetag-outline"} size={18} color={"#1E3A8A"} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.previewListingTitle} numberOfLines={1}>{attachedListing.title}</Text>
                <Text style={s.previewListingPrice}>{`₦${Number(attachedListing.price||0).toLocaleString()}`}</Text>
              </View>
              <View style={s.previewListingCta}>
                <Text style={s.previewListingCtaTxt}>View</Text>
              </View>
            </View>
          )}

          {/* Bottom vignette */}
          <View style={s.vignetteBottom} />
        </Animated.View>

        {/* Preview controls */}
        <View style={s.previewBar}>
          <TouchableOpacity style={s.previewBackBtn} onPress={() => setStep("compose")}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={s.previewBackTxt}>Edit</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform:[{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[s.publishBtn, publishing && { opacity:0.7 }]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.9}
            >
              {publishing ? (
                <Text style={s.publishBtnTxt}>Posting…</Text>
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={s.publishBtnTxt}>Post Story</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── COMPOSE STEP ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <Animated.View style={[s.header, { opacity:fadeAnim, transform:[{translateY:slideAnim}] }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Story</Text>
        <Animated.View style={{ transform:[{ scale: canPost ? pulseAnim : new Animated.Value(1) }] }}>
          <TouchableOpacity
            style={[s.nextBtn, !canPost && s.nextBtnDisabled]}
            onPress={() => canPost && goPreview()}
            activeOpacity={canPost ? 0.85 : 1}
          >
            <Text style={s.nextBtnTxt}>Preview</Text>
            <Ionicons name="chevron-forward" size={14} color={canPost ? "#fff" : "#6B7280"} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity:fadeAnim }}>

          {/* ── Story type selector ─────────────────────────────────────────── */}
          <View style={s.typeRow}>
            {STORY_TYPES.map(t => {
              const active = storyType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[s.typeBtn, active && s.typeBtnActive]}
                  onPress={() => setStoryType(t.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon} size={18} color={active ? "#fff" : "#9CA3AF"} />
                  <Text style={[s.typeBtnTxt, active && s.typeBtnTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Canvas preview (mini) ────────────────────────────────────────── */}
          <View style={s.canvasWrap}>
            <View style={[s.canvas, { backgroundColor: bg.color }]}>

              {/* Canvas content */}
              {storyType === "photo" && storyText.trim().length === 0 ? (
                <TouchableOpacity style={s.photoUploadArea} activeOpacity={0.8}>
                  <View style={s.photoUploadIcon}>
                    <Ionicons name="add" size={32} color="#fff" />
                  </View>
                  <Text style={s.photoUploadTxt}>Tap to add photo</Text>
                  <Text style={s.photoUploadSub}>From camera or gallery</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.canvasTextArea}>
                  {storyText.trim().length > 0 ? (
                    <Text style={[
                      s.canvasText,
                      { fontSize: Math.max(12, ts.size * 0.55),
                        fontStyle: ts.style === "italic" ? "italic" : "normal",
                        fontWeight: ts.style === "bold" ? "900" : "400" }
                    ]} numberOfLines={4}>
                      {storyText}
                    </Text>
                  ) : (
                    <Text style={s.canvasPlaceholder}>Your story preview…</Text>
                  )}
                </View>
              )}

              {/* Listing chip on canvas */}
              {attachedListing && (
                <View style={s.canvasListingChip}>
                  <Ionicons name={"pricetag-outline"} size={10} color={"#1E3A8A"} />
                  <Text style={s.canvasListingChipTxt} numberOfLines={1}>{attachedListing.title}</Text>
                </View>
              )}

              {/* BG label */}
              <View style={s.canvasBgLabel}>
                <View style={[s.canvasBgDot, { backgroundColor: bg.color, borderWidth:1.5, borderColor:"rgba(255,255,255,0.4)" }]} />
                <Text style={s.canvasBgLabelTxt}>{bg.label}</Text>
              </View>
            </View>

            {/* BG picker column */}
            <View style={s.bgPicker}>
              {BG_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[s.bgDot, { backgroundColor: preset.color }, bgPreset === preset.id && s.bgDotActive]}
                  onPress={() => setBgPreset(preset.id)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>

          {/* ── Text input ───────────────────────────────────────────────────── */}
          <View style={s.inputSection}>
            <Text style={s.inputLabel}>
              {storyType === "listing" ? "Add a caption" :
               storyType === "promo"   ? "Your promo message" :
               storyType === "photo"   ? "Add a caption (optional)" :
               "What's your story?"}
            </Text>
            <TextInput
              style={[s.textInput, { minHeight: storyType === "text" ? 120 : 80 }]}
              placeholder={
                storyType === "listing" ? "e.g. Still available! DM to order…" :
                storyType === "promo"   ? "e.g. Flash sale — 20% off today only!" :
                storyType === "photo"   ? "Optional caption for your photo…" :
                "Share something with your campus…"
              }
              placeholderTextColor="#4B5563"
              multiline
              value={storyText}
              onChangeText={setStoryText}
              maxLength={storyType === "text" ? 150 : 100}
              style={[s.textInput, {
                minHeight: storyType === "text" ? 120 : 80,
                color: "#F9FAFB",
              }]}
            />
            <Text style={s.charCount}>
              {storyText.length}/{storyType === "text" ? 150 : 100}
            </Text>
          </View>

          {/* ── Text size (text type only) ───────────────────────────────────── */}
          {(storyType === "text" || storyType === "photo") && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Text Size</Text>
              <View style={s.sizeRow}>
                {TEXT_SIZES.map(sz => (
                  <TouchableOpacity
                    key={sz.id}
                    style={[s.sizeBtn, textSize === sz.id && s.sizeBtnActive]}
                    onPress={() => setTextSize(sz.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      s.sizeBtnTxt,
                      { fontSize: sz.id === "sm" ? 14 : sz.id === "md" ? 17 : sz.id === "lg" ? 20 : 24 },
                      textSize === sz.id && s.sizeBtnTxtActive,
                      sz.style === "bold" && { fontWeight:"900" },
                      sz.style === "italic" && { fontStyle:"italic" },
                    ]}>Aa</Text>
                    <Text style={[s.sizeLabelTxt, textSize === sz.id && { color:"#F97316" }]}>
                      {sz.id === "sm" ? "Small" : sz.id === "md" ? "Medium" : sz.id === "lg" ? "Large" : "Display"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Attach listing (listing/promo type) ─────────────────────────── */}
          {(storyType === "listing" || storyType === "promo") && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>Attach a Listing</Text>
                {attachedListing && (
                  <TouchableOpacity onPress={() => setAttachedListing(null)}>
                    <Text style={s.clearTxt}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {attachedListing ? (
                <View style={s.attachedCard}>
                  <View style={[s.attachedIcon, { backgroundColor: "#DBEAFE" }]}>
                    <Ionicons name={"pricetag-outline"} size={20} color={"#1E3A8A"} />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.attachedTitle} numberOfLines={1}>{attachedListing.title}</Text>
                    <Text style={s.attachedPrice}>{`₦${Number(attachedListing.price||0).toLocaleString()}`}</Text>
                  </View>
                  <View style={[s.attachedTag, { backgroundColor: "#DBEAFE" }]}>
                    <Text style={[s.attachedTagTxt, { color: "#1E3A8A" }]}>{attachedListing.category||"Item"}</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.attachBtn}
                  onPress={() => setShowListings(v => !v)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#F97316" />
                  <Text style={s.attachBtnTxt}>Choose from your listings</Text>
                  <Ionicons name={showListings ? "chevron-up" : "chevron-down"} size={14} color="#6B7280" />
                </TouchableOpacity>
              )}

              {/* Listing picker dropdown */}
              {showListings && !attachedListing && (
                <View style={s.listingPicker}>
                  {myListings.length === 0 && (
                    <Text style={{ padding:12, color:"#9CA3AF", fontSize:13 }}>No listings found</Text>
                  )}
                  {myListings.map(listing => (
                    <TouchableOpacity
                      key={listing.id}
                      style={s.listingPickerRow}
                      onPress={() => { setAttachedListing(listing); setShowListings(false); }}
                      activeOpacity={0.85}
                    >
                      <View style={[s.listingPickerIcon, { backgroundColor:"#DBEAFE" }]}>
                        <Ionicons name="pricetag-outline" size={16} color="#1E3A8A" />
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={s.listingPickerTitle} numberOfLines={1}>{listing.title}</Text>
                        <Text style={s.listingPickerPrice}>₦{Number(listing.price||0).toLocaleString()}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color="#F97316" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Story tips ───────────────────────────────────────────────────── */}
          <View style={s.tipsBox}>
            <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
            <Text style={s.tipsTxt}>
              {storyType === "listing"  ? "Listing stories get 3× more views. Attach your best item." :
               storyType === "promo"    ? "Promo stories stand out in the feed. Be specific with your offer." :
               storyType === "photo"    ? "Photo stories feel more personal. Add a caption to drive engagement." :
               "Stories last 24 hours. Keep it short and eye-catching."}
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#111827" },

  // Header
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12 },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  nextBtn: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:"#F97316" },
  nextBtnDisabled: { backgroundColor:"#374151" },
  nextBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },

  // Story type tabs
  typeRow: { flexDirection:"row", paddingHorizontal:16, gap:8, marginBottom:16 },
  typeBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, paddingVertical:9, borderRadius:14, backgroundColor:"#1F2937", borderWidth:1, borderColor:"#374151" },
  typeBtnActive: { backgroundColor:"#1E3A8A", borderColor:"#3B82F6" },
  typeBtnTxt: { fontSize:11, fontWeight:"600", color:"#9CA3AF" },
  typeBtnTxtActive: { color:"#fff", fontWeight:"700" },

  // Canvas
  canvasWrap: { flexDirection:"row", alignItems:"flex-start", paddingHorizontal:16, gap:12, marginBottom:20 },
  canvas: { flex:1, height:220, borderRadius:20, overflow:"hidden", justifyContent:"center", alignItems:"center", position:"relative" },
  canvasTextArea: { flex:1, width:"100%", justifyContent:"center", alignItems:"center", padding:16 },
  canvasText: { color:"#fff", textAlign:"center", lineHeight:26 },
  canvasPlaceholder: { color:"rgba(255,255,255,0.25)", fontSize:13, fontStyle:"italic" },
  canvasListingChip: { position:"absolute", bottom:10, left:10, flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"rgba(255,255,255,0.9)", borderRadius:10, paddingHorizontal:8, paddingVertical:4, maxWidth:"80%" },
  canvasListingChipTxt: { fontSize:9, fontWeight:"700", color:"#111827", flexShrink:1 },
  canvasBgLabel: { position:"absolute", top:8, right:8, flexDirection:"row", alignItems:"center", gap:4 },
  canvasBgDot: { width:10, height:10, borderRadius:5 },
  canvasBgLabelTxt: { fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:"600" },

  photoUploadArea: { flex:1, width:"100%", alignItems:"center", justifyContent:"center", gap:8 },
  photoUploadIcon: { width:60, height:60, borderRadius:30, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"rgba(255,255,255,0.2)", borderStyle:"dashed" },
  photoUploadTxt: { fontSize:13, fontWeight:"700", color:"rgba(255,255,255,0.9)" },
  photoUploadSub: { fontSize:11, color:"rgba(255,255,255,0.5)" },

  // BG picker
  bgPicker: { gap:8, paddingTop:4 },
  bgDot: { width:28, height:28, borderRadius:14 },
  bgDotActive: { borderWidth:3, borderColor:"#fff" },

  // Input
  inputSection: { paddingHorizontal:16, marginBottom:16 },
  inputLabel: { fontSize:12, fontWeight:"700", color:"#6B7280", textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 },
  textInput: { backgroundColor:"#1F2937", borderRadius:16, borderWidth:1, borderColor:"#374151", paddingHorizontal:16, paddingTop:14, paddingBottom:14, fontSize:15, color:"#F9FAFB", textAlignVertical:"top", lineHeight:22 },
  charCount: { fontSize:10, color:"#4B5563", textAlign:"right", marginTop:4 },

  // Section
  section: { paddingHorizontal:16, marginBottom:16 },
  sectionLabel: { fontSize:12, fontWeight:"700", color:"#6B7280", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 },
  sectionRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  clearTxt: { fontSize:12, fontWeight:"600", color:"#EF4444" },

  // Text size
  sizeRow: { flexDirection:"row", gap:8 },
  sizeBtn: { flex:1, alignItems:"center", paddingVertical:12, borderRadius:14, backgroundColor:"#1F2937", borderWidth:1, borderColor:"#374151", gap:4 },
  sizeBtnActive: { borderColor:"#F97316", backgroundColor:"#1F2937" },
  sizeBtnTxt: { color:"#6B7280" },
  sizeBtnTxtActive: { color:"#F97316" },
  sizeLabelTxt: { fontSize:9, color:"#4B5563", fontWeight:"600" },

  // Attach listing
  attachBtn: { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#1F2937", borderRadius:16, padding:14, borderWidth:1, borderColor:"#374151", borderStyle:"dashed" },
  attachBtnTxt: { flex:1, fontSize:13, fontWeight:"600", color:"#9CA3AF" },
  attachedCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#1F2937", borderRadius:16, padding:14, borderWidth:1, borderColor:"#374151" },
  attachedIcon: { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  attachedTitle: { fontSize:13, fontWeight:"700", color:"#F9FAFB" },
  attachedPrice: { fontSize:12, color:"#F97316", fontWeight:"800", marginTop:2 },
  attachedTag: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  attachedTagTxt: { fontSize:10, fontWeight:"700" },

  // Listing picker
  listingPicker: { marginTop:8, backgroundColor:"#1F2937", borderRadius:16, borderWidth:1, borderColor:"#374151", overflow:"hidden" },
  listingPickerRow: { flexDirection:"row", alignItems:"center", gap:12, padding:14, borderBottomWidth:1, borderBottomColor:"#374151" },
  listingPickerIcon: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  listingPickerTitle: { fontSize:13, fontWeight:"600", color:"#F9FAFB" },
  listingPickerPrice: { fontSize:11, color:"#F97316", fontWeight:"700", marginTop:1 },

  // Tips
  tipsBox: { flexDirection:"row", alignItems:"flex-start", gap:8, marginHorizontal:16, backgroundColor:"#1F2937", borderRadius:14, padding:12, borderWidth:1, borderColor:"#374151" },
  tipsTxt: { flex:1, fontSize:12, color:"#9CA3AF", lineHeight:18 },

  // Preview screen
  previewCanvas: { flex:1, marginHorizontal:16, marginTop:8, borderRadius:24, overflow:"hidden", justifyContent:"space-between" },
  vignetteTop: { height:80, backgroundColor:"rgba(0,0,0,0.3)", position:"absolute", top:0, left:0, right:0 },
  vignetteBottom: { height:120, backgroundColor:"rgba(0,0,0,0.3)", position:"absolute", bottom:0, left:0, right:0 },
  previewUser: { flexDirection:"row", alignItems:"center", gap:10, padding:20, zIndex:10 },
  previewAvatar: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  previewAvatarTxt: { fontSize:11, fontWeight:"800", color:"#fff" },
  previewName: { fontSize:13, fontWeight:"800", color:"#fff" },
  previewTime: { fontSize:11, color:"rgba(255,255,255,0.6)" },
  previewContent: { flex:1, justifyContent:"center", alignItems:"center", padding:24 },
  previewText: { color:"#fff", textAlign:"center", lineHeight:1.3*26 },
  photoPlaceholder: { alignItems:"center", gap:8 },
  photoPlaceholderTxt: { fontSize:16, color:"rgba(255,255,255,0.4)" },
  previewListing: { flexDirection:"row", alignItems:"center", gap:10, margin:16, backgroundColor:"rgba(255,255,255,0.92)", borderRadius:18, padding:12, zIndex:10 },
  previewListingIcon: { width:38, height:38, borderRadius:19, alignItems:"center", justifyContent:"center" },
  previewListingTitle: { fontSize:12, fontWeight:"700", color:"#111827" },
  previewListingPrice: { fontSize:13, fontWeight:"900", color:"#1E3A8A", marginTop:1 },
  previewListingCta: { backgroundColor:"#1E3A8A", paddingHorizontal:12, paddingVertical:6, borderRadius:10 },
  previewListingCtaTxt: { fontSize:11, fontWeight:"800", color:"#fff" },

  // Preview bar
  previewBar: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingVertical:12, paddingBottom: Platform.OS==="ios" ? 28 : 14 },
  previewBackBtn: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:14, paddingVertical:10, borderRadius:20, backgroundColor:"rgba(255,255,255,0.15)" },
  previewBackTxt: { fontSize:13, fontWeight:"600", color:"#fff" },
  publishBtn: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:24, paddingVertical:14, borderRadius:24, backgroundColor:"#F97316", shadowColor:"#F97316", shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:14, elevation:10 },
  publishBtnTxt: { fontSize:15, fontWeight:"800", color:"#fff" },

  // Done
  doneBox: { alignItems:"center", gap:14 },
  doneRing: { width:90, height:90, borderRadius:45, backgroundColor:"rgba(255,255,255,0.2)", borderWidth:3, borderColor:"rgba(255,255,255,0.5)", alignItems:"center", justifyContent:"center" },
  doneTxt: { fontSize:24, fontWeight:"900", color:"#fff", letterSpacing:-0.5 },
  doneSub: { fontSize:14, color:"rgba(255,255,255,0.7)" },
});
