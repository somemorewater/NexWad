// app/admin.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, TextInput, Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { label:"Total Users",      value:"1,284",  change:"+38 this week",  icon:"people-outline",        bg:"#EFF6FF", color:"#1E3A8A" },
  { label:"Active Sellers",   value:"142",    change:"+7 this week",   icon:"storefront-outline",    bg:"#F0FDF4", color:"#15803D" },
  { label:"Live Listings",    value:"389",    change:"+54 this week",  icon:"grid-outline",          bg:"#FFF7ED", color:"#EA580C" },
  { label:"Weekly Revenue",   value:"₦284k",  change:"+22% vs last",   icon:"cash-outline",          bg:"#EDE9FE", color:"#4C1D95" },
];

const PENDING_SELLERS = [
  { id:"ps1", name:"Chioma Eze",       username:"chioma_",    matric:"AFIT/2022/0341", nin:"12345678901", submittedAt:"2h ago",  tier:"Basic", hasDocs:true  },
  { id:"ps2", name:"Babatunde Alabi",  username:"tundetech",  matric:"AFIT/2021/0188", nin:"98765432100", submittedAt:"5h ago",  tier:"Pro",   hasDocs:true  },
  { id:"ps3", name:"Miriam Audu",      username:"miriam.a",   matric:"AFIT/2023/0092", nin:"55544433322", submittedAt:"1d ago",  tier:"Basic", hasDocs:false },
  { id:"ps4", name:"Samuel Okafor",    username:"sam_sells",  matric:"AFIT/2022/0574", nin:"11122233344", submittedAt:"2d ago",  tier:"Elite", hasDocs:true  },
];

const REPORTS = [
  { id:"r1", type:"listing",  title:"Fake iPhone 14 listing",           reporter:"Ngozi A.",  target:"flash_sells",  time:"30m ago",  priority:"high"   },
  { id:"r2", type:"seller",   title:"Seller not responding after payment",reporter:"Emeka B.", target:"bookworm99",   time:"2h ago",   priority:"high"   },
  { id:"r3", type:"listing",  title:"Misleading price on charger",      reporter:"Ada O.",    target:"emeka.b",      time:"4h ago",   priority:"medium" },
  { id:"r4", type:"post",     title:"Spam post in feed",                reporter:"Tunde A.",  target:"anon_user",    time:"1d ago",   priority:"low"    },
  { id:"r5", type:"seller",   title:"Selling outside AFIT campus",      reporter:"Fatima Y.", target:"chuks_",       time:"2d ago",   priority:"medium" },
];

const RECENT_USERS = [
  { id:"u1", name:"Adaeze Okonkwo", username:"ada_sells",  role:"seller",  joined:"Today",     verified:true,  tier:"Pro"   },
  { id:"u2", name:"Chukwudi Eze",   username:"chuks_",     role:"seller",  joined:"Yesterday", verified:true,  tier:"Elite" },
  { id:"u3", name:"Ngozi Aliyu",    username:"ngozi.alli", role:"buyer",   joined:"2d ago",    verified:true,  tier:"Premium" },
  { id:"u4", name:"Fatima Yusuf",   username:"fatimay",    role:"seller",  joined:"3d ago",    verified:false, tier:"Basic" },
  { id:"u5", name:"Emeka Bright",   username:"emeka.b",    role:"buyer",   joined:"4d ago",    verified:true,  tier:null    },
];

const PRIORITY_COLOR = { high:"#EF4444", medium:"#F97316", low:"#6B7280" };
const PRIORITY_BG    = { high:"#FEF2F2", medium:"#FFF7ED", low:"#F3F4F6" };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const StatCard = ({ stat, index }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:360, delay:index*70, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:360, delay:index*70, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.statCard, { opacity:fa, transform:[{translateY:sa}] }]}>
      <View style={[s.statIcon, { backgroundColor:stat.bg }]}>
        <Ionicons name={stat.icon} size={18} color={stat.color} />
      </View>
      <Text style={s.statValue}>{stat.value}</Text>
      <Text style={s.statLabel}>{stat.label}</Text>
      <Text style={s.statChange}>{stat.change}</Text>
    </Animated.View>
  );
};

// ─── APPROVAL CARD ───────────────────────────────────────────────────────────
const ApprovalCard = ({ seller, index, onApprove, onReject }) => {
  const fa = useRef(new Animated.Value(0)).current;
  const sa = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fa, { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
      Animated.timing(sa, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.approvalCard, { opacity:fa, transform:[{translateY:sa}] }]}>
      <View style={s.approvalTop}>
        <View style={s.approvalAvatar}>
          <Text style={s.approvalAvatarTxt}>{seller.name.split(" ").map(n=>n[0]).join("")}</Text>
        </View>
        <View style={{ flex:1 }}>
          <View style={s.approvalNameRow}>
            <Text style={s.approvalName}>{seller.name}</Text>
            <View style={[s.tierBadge, { backgroundColor: seller.tier === "Elite" ? "#EDE9FE" : seller.tier === "Pro" ? "#EFF6FF" : "#F3F4F6" }]}>
              <Text style={[s.tierBadgeTxt, { color: seller.tier === "Elite" ? "#4C1D95" : seller.tier === "Pro" ? "#1E3A8A" : "#6B7280" }]}>
                {seller.tier}
              </Text>
            </View>
          </View>
          <Text style={s.approvalHandle}>@{seller.username} · {seller.matric}</Text>
          <Text style={s.approvalTime}>Applied {seller.submittedAt}</Text>
        </View>
      </View>
      <View style={s.approvalMeta}>
        <View style={s.approvalMetaItem}>
          <Ionicons name="id-card-outline" size={12} color="#6B7280" />
          <Text style={s.approvalMetaTxt}>NIN: {seller.nin}</Text>
        </View>
        <View style={[s.approvalMetaItem, { backgroundColor: seller.hasDocs ? "#F0FDF4" : "#FEF2F2" }]}>
          <Ionicons name={seller.hasDocs ? "checkmark-circle-outline" : "close-circle-outline"} size={12} color={seller.hasDocs ? "#15803D" : "#EF4444"} />
          <Text style={[s.approvalMetaTxt, { color: seller.hasDocs ? "#15803D" : "#EF4444" }]}>
            School ID {seller.hasDocs ? "uploaded" : "missing"}
          </Text>
        </View>
      </View>
      <View style={s.approvalActions}>
        <TouchableOpacity style={s.rejectBtn} onPress={() => onReject(seller.id)}>
          <Ionicons name="close" size={14} color="#EF4444" />
          <Text style={s.rejectBtnTxt}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.approveBtn, !seller.hasDocs && s.approveBtnDisabled]}
          onPress={() => seller.hasDocs && onApprove(seller.id)}
        >
          <Ionicons name="checkmark" size={14} color={seller.hasDocs ? "#fff" : "#9CA3AF"} />
          <Text style={[s.approveBtnTxt, !seller.hasDocs && { color:"#9CA3AF" }]}>
            {seller.hasDocs ? "Approve" : "Docs missing"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── REPORT CARD ─────────────────────────────────────────────────────────────
const ReportCard = ({ rep, index, onDismiss }) => {
  const fa = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fa, { toValue:1, duration:320, delay:index*50, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={[s.reportCard, { opacity:fa }]}>
      <View style={s.reportTop}>
        <View style={[s.priorityPill, { backgroundColor: PRIORITY_BG[rep.priority] }]}>
          <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLOR[rep.priority] }]} />
          <Text style={[s.priorityTxt, { color: PRIORITY_COLOR[rep.priority] }]}>{rep.priority}</Text>
        </View>
        <View style={s.reportTypePill}>
          <Ionicons name={rep.type === "listing" ? "pricetag-outline" : rep.type === "seller" ? "person-outline" : "newspaper-outline"} size={11} color="#6B7280" />
          <Text style={s.reportTypeTxt}>{rep.type}</Text>
        </View>
        <Text style={s.reportTime}>{rep.time}</Text>
      </View>
      <Text style={s.reportTitle}>{rep.title}</Text>
      <View style={s.reportMeta}>
        <Text style={s.reportMetaTxt}>Reported by <Text style={{ fontWeight:"700" }}>{rep.reporter}</Text></Text>
        <Text style={s.reportMetaTxt}>Target: <Text style={{ fontWeight:"700", color:"#EF4444" }}>@{rep.target}</Text></Text>
      </View>
      <View style={s.reportActions}>
        <TouchableOpacity style={s.dismissBtn} onPress={() => onDismiss(rep.id)}>
          <Text style={s.dismissBtnTxt}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.warnBtn}>
          <Text style={s.warnBtnTxt}>Warn User</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.banBtn}>
          <Ionicons name="ban-outline" size={13} color="#EF4444" />
          <Text style={s.banBtnTxt}>Ban</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab,         setTab]         = useState("approvals");
  const [search,      setSearch]      = useState("");
  const [approvals,   setApprovals]   = useState(PENDING_SELLERS);
  const [reports,     setReports]     = useState(REPORTS);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const approveSeller  = (id) => setApprovals(prev => prev.filter(s => s.id !== id));
  const rejectSeller   = (id) => setApprovals(prev => prev.filter(s => s.id !== id));
  const dismissReport  = (id) => setReports(prev => prev.filter(r => r.id !== id));

  const filteredUsers = RECENT_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Admin Dashboard</Text>
          <Text style={s.headerSub}>NEXWAD AFIT</Text>
        </View>
        <View style={s.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#FCD34D" />
          <Text style={s.adminBadgeTxt}>Admin</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:48 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* Stats */}
          <View style={s.statsGrid}>
            {PLATFORM_STATS.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
          </View>

          {/* Alert strip — pending items */}
          {(approvals.length > 0 || reports.filter(r => r.priority === "high").length > 0) && (
            <View style={s.alertStrip}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={s.alertTxt}>
                {approvals.length} seller approval{approvals.length !== 1 ? "s" : ""} pending
                {reports.filter(r => r.priority === "high").length > 0
                  ? ` · ${reports.filter(r => r.priority === "high").length} high-priority report${reports.filter(r => r.priority === "high").length !== 1 ? "s" : ""}`
                  : ""}
              </Text>
            </View>
          )}

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
            {[
              { id:"approvals", label:"Approvals",  badge: approvals.length },
              { id:"reports",   label:"Reports",    badge: reports.filter(r => r.priority === "high").length },
              { id:"users",     label:"Users",      badge: null },
              { id:"stats",     label:"Platform",   badge: null },
            ].map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.tab, tab === t.id && s.tabActive]}
                onPress={() => setTab(t.id)}
              >
                <Text style={[s.tabTxt, tab === t.id && s.tabTxtActive]}>{t.label}</Text>
                {t.badge > 0 && (
                  <View style={[s.tabBadge, tab === t.id && s.tabBadgeActive]}>
                    <Text style={[s.tabBadgeTxt, tab === t.id && { color:"#1E3A8A" }]}>{t.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── APPROVALS TAB ──────────────────────────────────────────────── */}
          {tab === "approvals" && (
            <View style={s.section}>
              {approvals.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="checkmark-circle-outline" size={44} color="#15803D" />
                  <Text style={s.emptyTitle}>All caught up!</Text>
                  <Text style={s.emptySub}>No pending seller applications.</Text>
                </View>
              ) : (
                approvals.map((seller, i) => (
                  <ApprovalCard
                    key={seller.id}
                    seller={seller}
                    index={i}
                    onApprove={approveSeller}
                    onReject={rejectSeller}
                  />
                ))
              )}
            </View>
          )}

          {/* ── REPORTS TAB ────────────────────────────────────────────────── */}
          {tab === "reports" && (
            <View style={s.section}>
              {reports.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="shield-checkmark-outline" size={44} color="#15803D" />
                  <Text style={s.emptyTitle}>No active reports</Text>
                  <Text style={s.emptySub}>All reports have been reviewed.</Text>
                </View>
              ) : (
                reports.map((rep, i) => (
                  <ReportCard
                    key={rep.id}
                    rep={rep}
                    index={i}
                    onDismiss={dismissReport}
                  />
                ))
              )}
            </View>
          )}

          {/* ── USERS TAB ──────────────────────────────────────────────────── */}
          {tab === "users" && (
            <View style={s.section}>
              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search users…"
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              {filteredUsers.map((user, i) => (
                <View key={user.id} style={s.userCard}>
                  <View style={s.userAvatar}>
                    <Text style={s.userAvatarTxt}>{user.name.split(" ").map(n=>n[0]).join("")}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <View style={s.userNameRow}>
                      <Text style={s.userName}>{user.name}</Text>
                      {user.verified && <Ionicons name="checkmark-circle" size={14} color="#1E3A8A" />}
                    </View>
                    <Text style={s.userHandle}>@{user.username} · Joined {user.joined}</Text>
                  </View>
                  <View style={{ alignItems:"flex-end", gap:4 }}>
                    <View style={s.roleChip}>
                      <Text style={s.roleChipTxt}>{user.role}</Text>
                    </View>
                    {user.tier && (
                      <Text style={s.userTier}>{user.tier}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── PLATFORM STATS TAB ─────────────────────────────────────────── */}
          {tab === "stats" && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Platform Health</Text>
              {[
                { label:"Verification rate",  value:"78%",   sub:"of registered users", color:"#1E3A8A" },
                { label:"Seller approval rate",value:"91%",  sub:"of applications",      color:"#15803D" },
                { label:"Active listing rate", value:"68%",  sub:"of all listings",      color:"#F97316" },
                { label:"Report resolution",   value:"94%",  sub:"within 24hrs",         color:"#4C1D95" },
              ].map((row, i) => (
                <View key={row.label} style={s.healthRow}>
                  <View style={{ flex:1 }}>
                    <Text style={s.healthLabel}>{row.label}</Text>
                    <Text style={s.healthSub}>{row.sub}</Text>
                  </View>
                  <Text style={[s.healthValue, { color:row.color }]}>{row.value}</Text>
                </View>
              ))}

              <View style={s.divider} />
              <Text style={s.sectionTitle}>Subscription Tiers</Text>
              {[
                { tier:"Basic Sellers",   count:94,  color:"#6B7280", bg:"#F3F4F6"  },
                { tier:"Pro Sellers",     count:31,  color:"#1E3A8A", bg:"#EFF6FF"  },
                { tier:"Elite Sellers",   count:17,  color:"#4C1D95", bg:"#EDE9FE"  },
                { tier:"Premium Buyers",  count:88,  color:"#F97316", bg:"#FFF7ED"  },
              ].map(tier => (
                <View key={tier.tier} style={s.tierRow}>
                  <View style={[s.tierDot, { backgroundColor:tier.bg }]}>
                    <View style={[s.tierDotInner, { backgroundColor:tier.color }]} />
                  </View>
                  <Text style={s.tierLabel}>{tier.tier}</Text>
                  <Text style={[s.tierCount, { color:tier.color }]}>{tier.count} users</Text>
                </View>
              ))}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:14, backgroundColor:"#111827" },
  headerTitle: { fontSize:17, fontWeight:"800", color:"#fff" },
  headerSub: { fontSize:10, color:"rgba(255,255,255,0.5)", letterSpacing:1.5, textTransform:"uppercase", marginTop:2 },
  adminBadge: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"rgba(255,255,255,0.12)", paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  adminBadgeTxt: { fontSize:11, fontWeight:"800", color:"#FCD34D" },

  statsGrid: { flexDirection:"row", flexWrap:"wrap", padding:12, gap:10 },
  statCard: { width:(W-44)/2, backgroundColor:"#fff", borderRadius:18, padding:14, gap:3, borderWidth:1, borderColor:"#F3F4F6" },
  statIcon: { width:34, height:34, borderRadius:17, alignItems:"center", justifyContent:"center", marginBottom:4 },
  statValue: { fontSize:20, fontWeight:"900", color:"#111827" },
  statLabel: { fontSize:11, color:"#6B7280", fontWeight:"600" },
  statChange: { fontSize:10, color:"#15803D", fontWeight:"700", marginTop:2 },

  alertStrip: { flexDirection:"row", alignItems:"center", gap:8, marginHorizontal:16, marginBottom:8, backgroundColor:"#FEF2F2", borderRadius:12, padding:12, borderWidth:1, borderColor:"#FCA5A5" },
  alertTxt: { fontSize:12, color:"#EF4444", fontWeight:"700", flex:1 },

  tabRow: { paddingHorizontal:16, paddingVertical:8, gap:8 },
  tab: { flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:"#fff", borderWidth:1, borderColor:"#E5E7EB" },
  tabActive: { backgroundColor:"#111827", borderColor:"#111827" },
  tabTxt: { fontSize:13, fontWeight:"600", color:"#6B7280" },
  tabTxtActive: { color:"#fff", fontWeight:"800" },
  tabBadge: { backgroundColor:"#EF4444", borderRadius:10, minWidth:18, height:18, alignItems:"center", justifyContent:"center", paddingHorizontal:4 },
  tabBadgeActive: { backgroundColor:"#FCD34D" },
  tabBadgeTxt: { fontSize:10, fontWeight:"900", color:"#fff" },

  section: { paddingHorizontal:16, paddingTop:8, gap:12 },
  sectionTitle: { fontSize:14, fontWeight:"800", color:"#111827" },
  divider: { height:1, backgroundColor:"#F3F4F6", marginVertical:4 },

  empty: { alignItems:"center", paddingVertical:48, gap:10 },
  emptyTitle: { fontSize:17, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF" },

  // Approvals
  approvalCard: { backgroundColor:"#fff", borderRadius:20, padding:16, borderWidth:1, borderColor:"#F3F4F6", gap:12 },
  approvalTop: { flexDirection:"row", gap:12, alignItems:"flex-start" },
  approvalAvatar: { width:44, height:44, borderRadius:22, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  approvalAvatarTxt: { fontSize:14, fontWeight:"900", color:"#fff" },
  approvalNameRow: { flexDirection:"row", alignItems:"center", gap:8 },
  approvalName: { fontSize:15, fontWeight:"800", color:"#111827" },
  tierBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  tierBadgeTxt: { fontSize:10, fontWeight:"800" },
  approvalHandle: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  approvalTime: { fontSize:10, color:"#C4C4C4", marginTop:3 },
  approvalMeta: { flexDirection:"row", gap:8, flexWrap:"wrap" },
  approvalMetaItem: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#F3F4F6", paddingHorizontal:8, paddingVertical:5, borderRadius:8 },
  approvalMetaTxt: { fontSize:11, color:"#6B7280", fontWeight:"600" },
  approvalActions: { flexDirection:"row", gap:10 },
  rejectBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, height:40, borderRadius:12, borderWidth:1.5, borderColor:"#FCA5A5" },
  rejectBtnTxt: { fontSize:13, fontWeight:"700", color:"#EF4444" },
  approveBtn: { flex:2, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, height:40, borderRadius:12, backgroundColor:"#15803D" },
  approveBtnDisabled: { backgroundColor:"#E5E7EB" },
  approveBtnTxt: { fontSize:13, fontWeight:"800", color:"#fff" },

  // Reports
  reportCard: { backgroundColor:"#fff", borderRadius:18, padding:16, borderWidth:1, borderColor:"#F3F4F6", gap:10 },
  reportTop: { flexDirection:"row", alignItems:"center", gap:8 },
  priorityPill: { flexDirection:"row", alignItems:"center", gap:5, paddingHorizontal:8, paddingVertical:4, borderRadius:10 },
  priorityDot: { width:6, height:6, borderRadius:3 },
  priorityTxt: { fontSize:10, fontWeight:"800" },
  reportTypePill: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#F3F4F6", paddingHorizontal:7, paddingVertical:3, borderRadius:8 },
  reportTypeTxt: { fontSize:10, color:"#6B7280", fontWeight:"600" },
  reportTime: { marginLeft:"auto", fontSize:10, color:"#C4C4C4" },
  reportTitle: { fontSize:14, fontWeight:"700", color:"#111827" },
  reportMeta: { gap:3 },
  reportMetaTxt: { fontSize:12, color:"#6B7280" },
  reportActions: { flexDirection:"row", gap:8 },
  dismissBtn: { paddingHorizontal:12, paddingVertical:7, borderRadius:10, backgroundColor:"#F3F4F6" },
  dismissBtnTxt: { fontSize:12, fontWeight:"600", color:"#6B7280" },
  warnBtn: { paddingHorizontal:12, paddingVertical:7, borderRadius:10, backgroundColor:"#FEF9C3" },
  warnBtnTxt: { fontSize:12, fontWeight:"700", color:"#B45309" },
  banBtn: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:12, paddingVertical:7, borderRadius:10, backgroundColor:"#FEF2F2" },
  banBtnTxt: { fontSize:12, fontWeight:"700", color:"#EF4444" },

  // Users
  searchBar: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#fff", borderRadius:14, paddingHorizontal:14, height:44, borderWidth:1, borderColor:"#E5E7EB" },
  searchInput: { flex:1, fontSize:14, color:"#111827" },
  userCard: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  userAvatar: { width:40, height:40, borderRadius:20, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  userAvatarTxt: { fontSize:12, fontWeight:"900", color:"#fff" },
  userNameRow: { flexDirection:"row", alignItems:"center", gap:5 },
  userName: { fontSize:14, fontWeight:"700", color:"#111827" },
  userHandle: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  roleChip: { backgroundColor:"#F3F4F6", paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  roleChipTxt: { fontSize:10, fontWeight:"700", color:"#6B7280" },
  userTier: { fontSize:10, fontWeight:"700", color:"#1E3A8A" },

  // Health
  healthRow: { flexDirection:"row", alignItems:"center", backgroundColor:"#fff", borderRadius:14, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  healthLabel: { fontSize:13, fontWeight:"700", color:"#111827" },
  healthSub: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  healthValue: { fontSize:20, fontWeight:"900" },
  tierRow: { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:"#fff", borderRadius:14, padding:14, borderWidth:1, borderColor:"#F3F4F6" },
  tierDot: { width:32, height:32, borderRadius:16, alignItems:"center", justifyContent:"center" },
  tierDotInner: { width:12, height:12, borderRadius:6 },
  tierLabel: { flex:1, fontSize:13, fontWeight:"700", color:"#111827" },
  tierCount: { fontSize:13, fontWeight:"800" },
});
