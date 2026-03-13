// app/(tabs)/profile.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, Dimensions, Platform, Modal, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

const SETTINGS_LIST = [
  { icon:"person-outline",           label:"Edit Profile",    route:"/(tabs)/edit-profile" },
  { icon:"shield-checkmark-outline", label:"Verification",    route:"/(tabs)/verification" },
  { icon:"card-outline",             label:"Payment Methods", route:"/(tabs)/payments"     },
  { icon:"cube-outline",             label:"My Orders",       route:"/(tabs)/orders"       },
  { icon:"chatbubble-outline",       label:"Messages",        route:"/(tabs)/messages"     },
  { icon:"settings-outline",         label:"Settings",        route:"/(tabs)/settings"     },
  { icon:"help-circle-outline",      label:"Help & Support",  route:"/(tabs)/support"      },
  { icon:"log-out-outline",          label:"Sign Out",        route:null, danger:true },
];

const NAV_TABS = [
  { key:"home",        iconFill:"home",      iconLine:"home-outline",       label:"Home",    route:"/(tabs)/feed"        },
  { key:"discover",    iconFill:"compass",    iconLine:"compass-outline",    label:"Discover",route:"/(tabs)/discover"    },
  { key:"marketplace", iconFill:"storefront", iconLine:"storefront-outline", label:"Market",  route:"/(tabs)/marketplace" },
  { key:"profile",     iconFill:"person",     iconLine:"person-outline",     label:"Profile", route:"/(tabs)/profile"     },
];

const BottomNav = () => (
  <View style={BN.bar}>
    {NAV_TABS.map(tab => {
      const on = tab.key === "profile";
      return (
        <TouchableOpacity key={tab.key} style={BN.tab} onPress={() => router.push(tab.route)} activeOpacity={0.7}>
          {on && <View style={BN.pip} />}
          <Ionicons name={on ? tab.iconFill : tab.iconLine} size={24} color={on ? "#F97316" : "#9CA3AF"} />
          <Text style={[BN.lbl, on && BN.lblOn]}>{tab.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);
const BN = StyleSheet.create({
  bar: { flexDirection:"row", backgroundColor:"#fff", borderTopWidth:1, borderTopColor:"#F3F4F6", paddingBottom:Platform.OS==="ios"?20:8, paddingTop:8, paddingHorizontal:8 },
  tab: { flex:1, alignItems:"center", justifyContent:"center", paddingVertical:4, position:"relative" },
  pip: { position:"absolute", top:-8, width:28, height:3, borderRadius:2, backgroundColor:"#F97316" },
  lbl: { fontSize:10, color:"#9CA3AF", fontWeight:"500", marginTop:2 },
  lblOn: { color:"#F97316", fontWeight:"700" },
});

const Stars = ({ rating, size = 12 }) => (
  <View style={{ flexDirection:"row", gap:2 }}>
    {Array.from({ length:5 }).map((_, i) => (
      <Ionicons key={i}
        name={i < Math.floor(rating) ? "star" : i === Math.floor(rating) && rating % 1 >= 0.5 ? "star-half" : "star-outline"}
        size={size} color={i < Math.ceil(rating) ? "#F59E0B" : "#D1D5DB"}
      />
    ))}
  </View>
);

const SettingsSheet = ({ visible, onClose, onSignOut }) => {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue:visible?0:500, useNativeDriver:true, damping:22, stiffness:220 }),
      Animated.timing(fadeAnim,  { toValue:visible?1:0, duration:200, useNativeDriver:true }),
    ]).start();
  }, [visible]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[SS.backdrop, { opacity:fadeAnim }]}>
        <TouchableOpacity style={{ flex:1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[SS.sheet, { transform:[{translateY:slideAnim}] }]}>
        <View style={SS.handle} />
        <Text style={SS.title}>Account</Text>
        {SETTINGS_LIST.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[SS.row, i < SETTINGS_LIST.length - 1 && SS.rowBorder]}
            onPress={() => {
              onClose();
              if (item.route) router.push(item.route);
              else onSignOut();
            }}
          >
            <View style={[SS.iconBox, item.danger && { backgroundColor:"#FEF2F2" }]}>
              <Ionicons name={item.icon} size={18} color={item.danger ? "#EF4444" : "#374151"} />
            </View>
            <Text style={[SS.rowLabel, item.danger && { color:"#EF4444" }]}>{item.label}</Text>
            {!item.danger && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
};
const SS = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.4)" },
  sheet: { position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:16, paddingBottom:Platform.OS==="ios"?36:24 },
  handle: { width:40, height:4, borderRadius:2, backgroundColor:"#E5E7EB", alignSelf:"center", marginTop:12, marginBottom:4 },
  title: { fontSize:13, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.8, textTransform:"uppercase", marginVertical:12, marginLeft:4 },
  row: { flexDirection:"row", alignItems:"center", gap:13, paddingVertical:13 },
  rowBorder: { borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  iconBox: { width:36, height:36, borderRadius:10, backgroundColor:"#F3F4F6", alignItems:"center", justifyContent:"center" },
  rowLabel: { flex:1, fontSize:15, fontWeight:"500", color:"#111827" },
});

const ListingCard = ({ item, index }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay:index*55, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay:index*55, useNativeDriver:true }),
    ]).start();
  }, []);
  const STATUS_STYLE = {
    active:    { bg:"#F0FDF4", color:"#15803D", label:"Active"  },
    sold:      { bg:"#FEF2F2", color:"#DC2626", label:"Sold"    },
    paused:    { bg:"#F3F4F6", color:"#6B7280", label:"Paused"  },
    available: { bg:"#F0FDF4", color:"#15803D", label:"Active"  },
  };
  const st = STATUS_STYLE[item.status] || STATUS_STYLE.active;
  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:CARD_W }}>
      <TouchableOpacity style={LC.card} activeOpacity={0.92} onPress={() => router.push(`/(tabs)/listing/${item.id}`)}>
        <View style={[LC.img, { backgroundColor:"#DBEAFE" }]}>
          <Ionicons name="pricetag-outline" size={32} color="#1E3A8A" style={{ opacity:0.28 }} />
          <View style={[LC.statusPill, { backgroundColor:st.bg }]}>
            <Text style={[LC.statusTxt, { color:st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={LC.info}>
          <View style={[LC.tag, { backgroundColor:"#DBEAFE" }]}>
            <Text style={[LC.tagTxt, { color:"#1E3A8A" }]}>{item.category}</Text>
          </View>
          <Text style={LC.title} numberOfLines={2}>{item.title}</Text>
          <View style={LC.footer}>
            <Text style={LC.price}>{item.priceStr}</Text>
            <View style={LC.views}>
              <Ionicons name="eye-outline" size={11} color="#9CA3AF" />
              <Text style={LC.viewsTxt}>{item.views || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
const LC = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, marginBottom:16 },
  img: { height:96, alignItems:"center", justifyContent:"center", position:"relative" },
  statusPill: { position:"absolute", top:7, left:7, paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  statusTxt: { fontSize:9, fontWeight:"800" },
  info: { padding:10 },
  tag: { alignSelf:"flex-start", paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginBottom:4 },
  tagTxt: { fontSize:9, fontWeight:"700" },
  title: { fontSize:12, fontWeight:"700", color:"#111827", lineHeight:17, marginBottom:7 },
  footer: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  price: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
  views: { flexDirection:"row", alignItems:"center", gap:3 },
  viewsTxt: { fontSize:10, color:"#9CA3AF" },
});

const SavedRow = ({ item }) => (
  <TouchableOpacity style={SR.row} onPress={() => router.push(`/(tabs)/listing/${item.id}`)} activeOpacity={0.88}>
    <View style={[SR.img, { backgroundColor:"#DBEAFE" }]}>
      <Ionicons name="pricetag-outline" size={20} color="#1E3A8A" style={{ opacity:0.5 }} />
    </View>
    <View style={{ flex:1 }}>
      <Text style={SR.title} numberOfLines={1}>{item.title}</Text>
      <Text style={SR.seller}>by {item.seller?.name || "Seller"}</Text>
    </View>
    <Text style={SR.price}>{item.priceStr}</Text>
    <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
  </TouchableOpacity>
);
const SR = StyleSheet.create({
  row: { flexDirection:"row", alignItems:"center", gap:12, paddingVertical:11, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  img: { width:44, height:44, borderRadius:12, alignItems:"center", justifyContent:"center" },
  title: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:2 },
  seller: { fontSize:11, color:"#9CA3AF" },
  price: { fontSize:13, fontWeight:"800", color:"#1E3A8A" },
});

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile,      setProfile]      = useState(null);
  const [myListings,   setMyListings]   = useState([]);
  const [savedItems,   setSavedItems]   = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("listings");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;
  const tabLine   = useRef(new Animated.Value(0)).current;
  const TABS      = ["listings", "reviews", "saved"];
  const TAB_W     = (W - 32) / 3;

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, listingsRes, savedRes] = await Promise.all([
          api.users.me(),
          api.listings.bySeller(user?.id),
          api.saved.listings.list(),
        ]);
        setProfile(profileRes.user || profileRes);
        setMyListings(listingsRes.listings || []);
        setSavedItems(savedRes.listings || savedRes.items || []);
      } catch (err) {
        console.log("[profile load]", err.message);
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue:1, duration:460, useNativeDriver:true }),
          Animated.timing(slideAnim, { toValue:0, duration:460, useNativeDriver:true }),
        ]).start();
      }
    };
    if (user?.id) load();
  }, [user]);

  const switchTab = (key) => {
    const idx = TABS.indexOf(key);
    Animated.spring(tabLine, { toValue:idx * TAB_W, useNativeDriver:true, damping:20, stiffness:200 }).start();
    setActiveTab(key);
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) {}
    router.replace("/Login");
  };

  const initials = profile?.name ? profile.name.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase() : "?";
  const isSeller = profile?.seller_profiles || profile?.isSeller;

  const activeListings = myListings.filter(l => l.status === "active" || l.status === "available");
  const soldListings   = myListings.filter(l => l.status === "sold");
  const pausedListings = myListings.filter(l => l.status === "paused");

  const listingRows = [];
  for (let i = 0; i < myListings.length; i += 2) listingRows.push(myListings.slice(i, i+2));

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
      <View style={s.topBar}>
        <Text style={s.topHandle}>@{profile?.username || "profile"}</Text>
        <View style={s.topRight}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/notifications")} style={s.topBtn}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsOpen(true)} style={s.topBtn}>
            <Ionicons name="menu-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:100 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          <View style={s.identityBlock}>
            <View style={s.avatarWrap}>
              <View style={[s.avatar, { backgroundColor:"#DBEAFE" }]}>
                <Text style={[s.avatarTxt, { color:"#1E3A8A" }]}>{initials}</Text>
              </View>
              <TouchableOpacity style={s.editAvatarBtn} onPress={() => router.push("/(tabs)/edit-profile")}>
                <Ionicons name="camera" size={13} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.nameRow}>
              <Text style={s.name}>{profile?.name || "User"}</Text>
              {profile?.is_verified && (
                <View style={s.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>

            <View style={s.studentPills}>
              {profile?.dept && (
                <View style={s.pill}>
                  <Ionicons name="school-outline" size={12} color="#1E3A8A" />
                  <Text style={s.pillTxt}>{profile.dept}</Text>
                </View>
              )}
              {profile?.matric && (
                <View style={s.pill}>
                  <Ionicons name="id-card-outline" size={12} color="#6B7280" />
                  <Text style={[s.pillTxt, { color:"#6B7280" }]}>{profile.matric}</Text>
                </View>
              )}
            </View>

            {profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}

            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialItem}>
                <Text style={s.socialNum}>{myListings.length}</Text>
                <Text style={s.socialLbl}>Listings</Text>
              </TouchableOpacity>
              <View style={s.socialDivider} />
              <TouchableOpacity style={s.socialItem}>
                <Text style={s.socialNum}>{profile?.followers || 0}</Text>
                <Text style={s.socialLbl}>Followers</Text>
              </TouchableOpacity>
              <View style={s.socialDivider} />
              <TouchableOpacity style={s.socialItem}>
                <Text style={s.socialNum}>{profile?.following || 0}</Text>
                <Text style={s.socialLbl}>Following</Text>
              </TouchableOpacity>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.editBtn} onPress={() => router.push("/(tabs)/edit-profile")}>
                <Ionicons name="create-outline" size={15} color="#1E3A8A" />
                <Text style={s.editBtnTxt}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareBtn} onPress={() => router.push("/(tabs)/share-profile")}>
                <Ionicons name="share-social-outline" size={15} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {isSeller ? (
            <TouchableOpacity style={s.sellerCard} onPress={() => router.push("/(tabs)/seller-dashboard")} activeOpacity={0.88}>
              <View style={s.sellerCardLeft}>
                <View style={s.sellerIconWrap}>
                  <Ionicons name="storefront" size={20} color="#1E3A8A" />
                </View>
                <View>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
                    <Text style={s.sellerCardTitle}>Seller Account</Text>
                    <View style={s.activePill}>
                      <View style={s.activeDot} />
                      <Text style={s.activeTxt}>Active</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginTop:4 }}>
                    <Text style={s.sellerMetaTxt}>{soldListings.length} sales</Text>
                  </View>
                </View>
              </View>
              <View style={s.sellerCardRight}>
                <Text style={s.sellerDashTxt}>Dashboard</Text>
                <Ionicons name="chevron-forward" size={14} color="#1E3A8A" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.becomeSellerCard} onPress={() => router.push("/(tabs)/become-seller")}>
              <Ionicons name="storefront-outline" size={20} color="#F97316" />
              <View style={{ flex:1 }}>
                <Text style={s.becomeSellerTitle}>Start selling on Nexwad</Text>
                <Text style={s.becomeSellerSub}>Turn your unused items into cash.</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#F97316" />
            </TouchableOpacity>
          )}

          <View style={s.quickActions}>
            {[
              { icon:"bag-outline",       label:"My Orders",   route:"/(tabs)/orders",      bg:"#EFF6FF", color:"#1E3A8A" },
              { icon:"chatbubble-outline", label:"Messages",    route:"/(tabs)/messages",    bg:"#F0FDF4", color:"#15803D" },
              { icon:"add-circle-outline", label:"New Listing", route:"/(tabs)/new-listing", bg:"#FFF7ED", color:"#EA580C" },
              { icon:"bookmark-outline",   label:"Saved",       route:null,                  bg:"#FDF4FF", color:"#7C3AED", tab:"saved" },
            ].map(action => (
              <TouchableOpacity
                key={action.label}
                style={s.quickBtn}
                onPress={() => action.tab ? switchTab(action.tab) : router.push(action.route)}
              >
                <View style={[s.quickIcon, { backgroundColor:action.bg }]}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={s.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.tabsWrap}>
            <View style={s.tabsRow}>
              {[
                { key:"listings", label:"Listings", icon:"grid",     iconOff:"grid-outline"     },
                { key:"reviews",  label:"Reviews",  icon:"star",     iconOff:"star-outline"     },
                { key:"saved",    label:"Saved",    icon:"bookmark", iconOff:"bookmark-outline" },
              ].map(tab => {
                const on = activeTab === tab.key;
                return (
                  <TouchableOpacity key={tab.key} style={s.tabBtn} onPress={() => switchTab(tab.key)}>
                    <Ionicons name={on ? tab.icon : tab.iconOff} size={15} color={on ? "#1E3A8A" : "#9CA3AF"} />
                    <Text style={[s.tabTxt, on && s.tabTxtOn]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Animated.View style={[s.tabIndicator, { width:TAB_W, transform:[{translateX:tabLine}] }]} />
          </View>

          <View style={s.tabContent}>
            {activeTab === "listings" && (
              <View>
                <View style={s.listingsMeta}>
                  {[
                    { label:"Active", count:activeListings.length, color:"#15803D", bg:"#F0FDF4" },
                    { label:"Sold",   count:soldListings.length,   color:"#DC2626", bg:"#FEF2F2" },
                    { label:"Paused", count:pausedListings.length, color:"#6B7280", bg:"#F3F4F6" },
                  ].map(stat => (
                    <View key={stat.label} style={[s.metaStat, { backgroundColor:stat.bg }]}>
                      <Text style={[s.metaStatNum, { color:stat.color }]}>{stat.count}</Text>
                      <Text style={[s.metaStatLbl, { color:stat.color }]}>{stat.label}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addListingBtn} onPress={() => router.push("/(tabs)/new-listing")}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={s.addListingTxt}>Add</Text>
                  </TouchableOpacity>
                </View>
                {myListings.length === 0 ? (
                  <View style={s.empty}>
                    <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                    <Text style={s.emptyTitle}>No listings yet</Text>
                    <Text style={s.emptySub}>Tap Add to create your first listing</Text>
                  </View>
                ) : (
                  listingRows.map((row, ri) => (
                    <View key={ri} style={s.gridRow}>
                      {row.map((item, ci) => <ListingCard key={item.id} item={item} index={ri*2+ci} />)}
                      {row.length === 1 && <View style={{ width:CARD_W }} />}
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === "reviews" && (
              <View>
                {reviews.length === 0 ? (
                  <View style={s.empty}>
                    <Ionicons name="star-outline" size={40} color="#D1D5DB" />
                    <Text style={s.emptyTitle}>No reviews yet</Text>
                    <Text style={s.emptySub}>Reviews from buyers will appear here</Text>
                  </View>
                ) : (
                  reviews.map(r => (
                    <View key={r.id} style={s.reviewCard}>
                      <View style={s.reviewHeader}>
                        <View style={[s.reviewAvatar, { backgroundColor:"#DBEAFE" }]}>
                          <Text style={[s.reviewInitials, { color:"#1E3A8A" }]}>
                            {(r.reviewer?.name||"U").substring(0,2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={s.reviewName}>{r.reviewer?.name || "User"}</Text>
                          <Stars rating={r.rating} size={11} />
                        </View>
                        <Text style={s.reviewTime}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={s.reviewComment}>{r.comment}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === "saved" && (
              <View>
                <View style={s.savedHeader}>
                  <Text style={s.savedCount}>{savedItems.length} saved items</Text>
                </View>
                {savedItems.length === 0 ? (
                  <View style={s.empty}>
                    <Ionicons name="bookmark-outline" size={40} color="#D1D5DB" />
                    <Text style={s.emptyTitle}>Nothing saved yet</Text>
                    <Text style={s.emptySub}>Tap the bookmark on any listing to save it here</Text>
                  </View>
                ) : (
                  savedItems.map(item => <SavedRow key={item.id} item={item} />)
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <TouchableOpacity style={s.cartFab} onPress={() => router.push("/(tabs)/cart")}>
        <Ionicons name="bag-outline" size={20} color="#fff" />
      </TouchableOpacity>

      <BottomNav />
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} onSignOut={handleSignOut} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#fff" },
  topBar: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  topHandle: { fontSize:16, fontWeight:"900", color:"#111827" },
  topRight: { flexDirection:"row", alignItems:"center", gap:4 },
  topBtn: { padding:6, position:"relative" },
  notifDot: { position:"absolute", top:6, right:6, width:7, height:7, borderRadius:4, backgroundColor:"#F97316", borderWidth:1.5, borderColor:"#fff" },
  identityBlock: { paddingHorizontal:20, paddingTop:20, paddingBottom:16, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  avatarWrap: { position:"relative", alignSelf:"flex-start", marginBottom:12 },
  avatar: { width:80, height:80, borderRadius:40, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:26, fontWeight:"900" },
  editAvatarBtn: { position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#fff" },
  nameRow: { flexDirection:"row", alignItems:"center", gap:7, marginBottom:6 },
  name: { fontSize:22, fontWeight:"900", color:"#111827", letterSpacing:-0.5 },
  verifiedBadge: { width:20, height:20, borderRadius:10, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" },
  studentPills: { flexDirection:"row", flexWrap:"wrap", gap:7, marginBottom:10 },
  pill: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#F3F4F6", paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  pillTxt: { fontSize:11, fontWeight:"600", color:"#1E3A8A" },
  bio: { fontSize:14, color:"#374151", lineHeight:21, marginBottom:14 },
  socialRow: { flexDirection:"row", alignItems:"center", backgroundColor:"#F9FAFB", borderRadius:18, padding:12, marginBottom:14, gap:0 },
  socialItem: { flex:1, alignItems:"center" },
  socialNum: { fontSize:18, fontWeight:"900", color:"#111827" },
  socialLbl: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  socialDivider: { width:1, height:28, backgroundColor:"#E5E7EB" },
  actionRow: { flexDirection:"row", gap:10 },
  editBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, height:40, borderRadius:14, borderWidth:1.5, borderColor:"#BFDBFE", backgroundColor:"#EFF6FF" },
  editBtnTxt: { fontSize:13, fontWeight:"700", color:"#1E3A8A" },
  shareBtn: { width:40, height:40, borderRadius:14, borderWidth:1.5, borderColor:"#E5E7EB", alignItems:"center", justifyContent:"center" },
  sellerCard: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginHorizontal:16, marginTop:14, backgroundColor:"#EFF6FF", borderRadius:18, padding:14, borderWidth:1, borderColor:"#BFDBFE" },
  sellerCardLeft: { flexDirection:"row", alignItems:"center", gap:12, flex:1 },
  sellerIconWrap: { width:40, height:40, borderRadius:12, backgroundColor:"#DBEAFE", alignItems:"center", justifyContent:"center" },
  sellerCardTitle: { fontSize:14, fontWeight:"800", color:"#1E3A8A" },
  activePill: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#F0FDF4", paddingHorizontal:7, paddingVertical:2, borderRadius:8 },
  activeDot: { width:6, height:6, borderRadius:3, backgroundColor:"#22C55E" },
  activeTxt: { fontSize:10, fontWeight:"700", color:"#15803D" },
  sellerMetaTxt: { fontSize:11, color:"#3B82F6" },
  sellerCardRight: { flexDirection:"row", alignItems:"center", gap:4 },
  sellerDashTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  becomeSellerCard: { flexDirection:"row", alignItems:"center", gap:12, marginHorizontal:16, marginTop:14, backgroundColor:"#FFF7ED", borderRadius:18, padding:14, borderWidth:1, borderColor:"#FED7AA" },
  becomeSellerTitle: { fontSize:13, fontWeight:"700", color:"#EA580C" },
  becomeSellerSub: { fontSize:11, color:"#9CA3AF", marginTop:1 },
  quickActions: { flexDirection:"row", justifyContent:"space-around", marginHorizontal:16, marginTop:16, backgroundColor:"#F9FAFB", borderRadius:20, paddingVertical:16, paddingHorizontal:8, borderWidth:1, borderColor:"#F3F4F6" },
  quickBtn: { alignItems:"center", gap:6 },
  quickIcon: { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center" },
  quickLabel: { fontSize:10, fontWeight:"600", color:"#374151" },
  tabsWrap: { borderBottomWidth:1, borderBottomColor:"#F3F4F6", marginTop:16 },
  tabsRow: { flexDirection:"row" },
  tabBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:5, paddingVertical:13 },
  tabTxt: { fontSize:13, fontWeight:"600", color:"#9CA3AF" },
  tabTxtOn: { color:"#1E3A8A", fontWeight:"700" },
  tabIndicator: { height:2.5, backgroundColor:"#1E3A8A", borderRadius:2 },
  tabContent: { padding:16 },
  listingsMeta: { flexDirection:"row", alignItems:"center", gap:8, marginBottom:14 },
  metaStat: { paddingHorizontal:10, paddingVertical:6, borderRadius:12, alignItems:"center" },
  metaStatNum: { fontSize:15, fontWeight:"900" },
  metaStatLbl: { fontSize:9, fontWeight:"700", marginTop:1 },
  addListingBtn: { marginLeft:"auto", flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#F97316", paddingHorizontal:12, paddingVertical:8, borderRadius:14 },
  addListingTxt: { fontSize:12, fontWeight:"700", color:"#fff" },
  gridRow: { flexDirection:"row", gap:16 },
  reviewCard: { backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6", marginBottom:12 },
  reviewHeader: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
  reviewAvatar: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  reviewInitials: { fontSize:11, fontWeight:"800" },
  reviewName: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:3 },
  reviewTime: { fontSize:11, color:"#9CA3AF" },
  reviewComment: { fontSize:13, color:"#374151", lineHeight:20 },
  savedHeader: { marginBottom:8 },
  savedCount: { fontSize:12, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.5, textTransform:"uppercase" },
  empty: { alignItems:"center", paddingTop:40, gap:8 },
  emptyTitle: { fontSize:16, fontWeight:"700", color:"#374151" },
  emptySub: { fontSize:13, color:"#9CA3AF", textAlign:"center" },
  cartFab: { position:"absolute", bottom:Platform.OS==="ios"?90:74, right:16, width:50, height:50, borderRadius:25, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:6}, shadowOpacity:0.3, shadowRadius:12, elevation:10, zIndex:100 },
});
