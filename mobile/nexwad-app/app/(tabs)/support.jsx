// app/support.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id:"orders",   label:"Orders",    icon:"bag-outline",            bg:"#EFF6FF", color:"#1E3A8A" },
  { id:"payments", label:"Payments",  icon:"card-outline",           bg:"#F0FDF4", color:"#15803D" },
  { id:"account",  label:"Account",   icon:"person-outline",         bg:"#FFF7ED", color:"#EA580C" },
  { id:"safety",   label:"Safety",    icon:"shield-outline",         bg:"#EDE9FE", color:"#4C1D95" },
  { id:"selling",  label:"Selling",   icon:"storefront-outline",     bg:"#FEF9C3", color:"#B45309" },
  { id:"other",    label:"Other",     icon:"help-circle-outline",    bg:"#F3F4F6", color:"#6B7280" },
];

const FAQS = [
  {
    id:"f1", cat:"orders",
    q:"How do I track my order?",
    a:"Go to your Orders page from the Profile tab. Tap any order to see its full tracking timeline and seller contact.",
  },
  {
    id:"f2", cat:"orders",
    q:"Can I cancel an order?",
    a:"You can cancel a Pending order from the order detail page. Once a seller confirms, cancellation needs to be agreed with the seller via chat.",
  },
  {
    id:"f3", cat:"payments",
    q:"When does the seller get paid?",
    a:"For Pay on Delivery, the seller receives payment at pickup. For bank transfers, payment is sent directly to the seller's registered account.",
  },
  {
    id:"f4", cat:"payments",
    q:"Is my card information safe?",
    a:"Yes. Card details are encrypted with bank-grade security. Nexwad never stores raw card numbers.",
  },
  {
    id:"f5", cat:"account",
    q:"How do I become a verified seller?",
    a:"Go to Profile → Verification and complete all 5 steps: matric confirmation, AFIT email, student ID photo, phone number, and payment method.",
  },
  {
    id:"f6", cat:"selling",
    q:"What fees does Nexwad charge?",
    a:"Nexwad is free for basic sellers. Pro sellers pay a flat monthly fee with zero commission on sales.",
  },
  {
    id:"f7", cat:"safety",
    q:"What if a seller scams me?",
    a:"Report the seller via the listing page using the flag icon. Our team reviews reports within 24 hours. Always transact on campus and use the in-app payment system.",
  },
  {
    id:"f8", cat:"other",
    q:"How do I delete my account?",
    a:"Go to Settings → Danger Zone → Delete Account. This action is permanent and all your data will be removed within 7 days.",
  },
];

const FAQItem = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const anim   = useRef(new Animated.Value(0)).current;
  const rotate = anim.interpolate({ inputRange:[0,1], outputRange:["0deg","180deg"] });
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:300, delay:index*40, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:300, delay:index*40, useNativeDriver:true }),
    ]).start();
  }, []);

  const toggle = () => {
    Animated.spring(anim, { toValue:open?0:1, useNativeDriver:true, damping:18, stiffness:200 }).start();
    setOpen(v => !v);
  };

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>
      <TouchableOpacity style={[F.card, open && F.cardOpen]} onPress={toggle} activeOpacity={0.88}>
        <View style={F.qRow}>
          <Text style={[F.q, open && { color:"#1E3A8A" }]}>{item.q}</Text>
          <Animated.View style={{ transform:[{rotate}] }}>
            <Ionicons name="chevron-down" size={18} color={open ? "#1E3A8A" : "#9CA3AF"} />
          </Animated.View>
        </View>
        {open && <Text style={F.a}>{item.a}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};
const F = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, padding:16, marginBottom:10, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardOpen: { borderColor:"#BFDBFE", backgroundColor:"#F8FBFF" },
  qRow: { flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", gap:12 },
  q: { flex:1, fontSize:14, fontWeight:"700", color:"#111827", lineHeight:20 },
  a: { fontSize:13, color:"#6B7280", lineHeight:20, marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor:"#EFF6FF" },
});

export default function Support() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:430, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:430, useNativeDriver:true }),
    ]).start();
  }, []);

  const filteredFaqs = FAQS.filter(f => {
    const matchesCat = category === "all" || f.cat === category;
    const matchesQ   = f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width:24 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:48 }}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="help-buoy" size={28} color="#1E3A8A" />
          </View>
          <Text style={s.heroTitle}>How can we help?</Text>
          {/* Search */}
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={s.searchInput}
              placeholder="Search for answers…"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contact options */}
        <View style={s.contactRow}>
          {[
            { icon:"chatbubble-ellipses-outline", label:"Live Chat",  sub:"~2 min reply",    color:"#1E3A8A", bg:"#EFF6FF", action:() => router.push("/messages") },
            { icon:"mail-outline",                 label:"Email Us",   sub:"24hr response",   color:"#15803D", bg:"#F0FDF4", action:() => {} },
            { icon:"logo-whatsapp",                label:"WhatsApp",   sub:"Quick help",      color:"#25D366", bg:"#F0FFF4", action:() => {} },
          ].map(opt => (
            <TouchableOpacity key={opt.label} style={s.contactCard} onPress={opt.action}>
              <View style={[s.contactIcon, { backgroundColor:opt.bg }]}>
                <Ionicons name={opt.icon} size={20} color={opt.color} />
              </View>
              <Text style={s.contactLabel}>{opt.label}</Text>
              <Text style={s.contactSub}>{opt.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:16, gap:8, paddingVertical:8 }}
        >
          <TouchableOpacity
            style={[s.catChip, category==="all" && s.catChipOn]}
            onPress={() => setCategory("all")}
          >
            <Text style={[s.catChipTxt, category==="all" && s.catChipTxtOn]}>All Topics</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catChip, category===cat.id && s.catChipOn]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons name={cat.icon} size={13} color={category===cat.id?"#fff":cat.color} />
              <Text style={[s.catChipTxt, category===cat.id && s.catChipTxtOn]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQs */}
        <View style={s.faqsWrap}>
          <Text style={s.sectionLabel}>
            {filteredFaqs.length} question{filteredFaqs.length!==1?"s":""}
            {category !== "all" ? ` in ${CATEGORIES.find(c=>c.id===category)?.label}` : ""}
          </Text>
          {filteredFaqs.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="search-outline" size={40} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No results found</Text>
              <Text style={s.emptySub}>Try a different search term or topic</Text>
            </View>
          ) : (
            filteredFaqs.map((faq, i) => <FAQItem key={faq.id} item={faq} index={i} />)
          )}
        </View>

        {/* Footer CTA */}
        <View style={s.footerCard}>
          <Ionicons name="chatbubble-outline" size={20} color="#F97316" />
          <View style={{ flex:1 }}>
            <Text style={s.footerTitle}>Still need help?</Text>
            <Text style={s.footerSub}>Our support team is available Mon–Fri, 8am–6pm.</Text>
          </View>
          <TouchableOpacity style={s.footerBtn} onPress={() => router.push("/messages")}>
            <Text style={s.footerBtnTxt}>Chat</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#111827" },
  hero: { backgroundColor:"#1E3A8A", paddingHorizontal:20, paddingTop:24, paddingBottom:28, alignItems:"center", gap:10 },
  heroIcon: { width:58, height:58, borderRadius:20, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:4 },
  heroTitle: { fontSize:20, fontWeight:"900", color:"#fff", letterSpacing:-0.3 },
  searchBar: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#fff", borderRadius:14, paddingHorizontal:14, height:44, width:"100%" },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  contactRow: { flexDirection:"row", gap:10, paddingHorizontal:16, marginTop:16, marginBottom:4 },
  contactCard: { flex:1, backgroundColor:"#fff", borderRadius:18, padding:14, alignItems:"center", gap:6, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  contactIcon: { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center" },
  contactLabel: { fontSize:12, fontWeight:"700", color:"#111827" },
  contactSub: { fontSize:10, color:"#9CA3AF" },
  catChip: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:13, paddingVertical:7, borderRadius:20, backgroundColor:"#fff", borderWidth:1, borderColor:"#E5E7EB" },
  catChipOn: { backgroundColor:"#1E3A8A", borderColor:"#1E3A8A" },
  catChipTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  catChipTxtOn: { color:"#fff" },
  faqsWrap: { padding:16 },
  sectionLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 },
  empty: { alignItems:"center", paddingTop:40, gap:8 },
  emptyTitle: { fontSize:16, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF" },
  footerCard: { flexDirection:"row", alignItems:"center", gap:12, marginHorizontal:16, backgroundColor:"#FFF7ED", borderRadius:20, padding:16, borderWidth:1, borderColor:"#FED7AA" },
  footerTitle: { fontSize:13, fontWeight:"700", color:"#EA580C" },
  footerSub: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  footerBtn: { backgroundColor:"#F97316", paddingHorizontal:16, paddingVertical:9, borderRadius:14 },
  footerBtnTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
});
