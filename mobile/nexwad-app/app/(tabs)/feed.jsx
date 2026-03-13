// app/(tabs)/feed.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, FlatList, Modal, Dimensions, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEED_ITEMS = [
  { id: "1", type: "listing", user: { name: "Adaeze Okonkwo", handle: "ada_sells", initials: "AO", avatarBg: "#DCFCE7", avatarColor: "#15803D", dept: "CSC 300L" }, time: "2m", content: "Selling my Engineering Mathematics textbook (Stroud 7th ed). Barely used, all pages intact. Perfect for 200L students.", price: "₦4,500", tag: "Textbooks", tagBg: "#DBEAFE", tagColor: "#1E3A8A", likes: 14, comments: 3, saved: false, hasImage: true, imgBg: "#DCFCE7", imgIcon: "book-outline", imgIconColor: "#15803D", ad: false },
  { id: "2", type: "ad", user: { name: "Nexwad Ads", handle: "sponsored", initials: "NX", avatarBg: "#FFF7ED", avatarColor: "#EA580C", dept: "" }, content: "Upgrade to Nexwad Pro and list unlimited products with zero commission. First month FREE for AFIT students.", tag: "Sponsored", tagBg: "#FFF7ED", tagColor: "#EA580C", hasImage: false, ad: true, cta: "Get Pro" },
  { id: "3", type: "listing", user: { name: "Emeka Balogun", handle: "emeka.b", initials: "EB", avatarBg: "#FEF9C3", avatarColor: "#854D0E", dept: "EEE 400L" }, time: "18m", content: "HP laptop charger (65W, USB-C) available. Works with most HP Pavilion & Envy models. DM to confirm compatibility.", price: "₦6,000", tag: "Electronics", tagBg: "#FEF9C3", tagColor: "#854D0E", likes: 32, comments: 7, saved: true, hasImage: true, imgBg: "#FEF9C3", imgIcon: "flash-outline", imgIconColor: "#854D0E", ad: false },
  { id: "4", type: "listing", user: { name: "Fatima Yusuf", handle: "fatimay", initials: "FY", avatarBg: "#FCE7F3", avatarColor: "#9D174D", dept: "MEC 200L" }, time: "45m", content: "Home-cooked jollof rice + protein available daily 12pm–3pm. Pick up at Block C hostel.", price: "₦800/plate", tag: "Food", tagBg: "#FCE7F3", tagColor: "#9D174D", likes: 88, comments: 21, saved: false, hasImage: true, imgBg: "#FEF3C7", imgIcon: "restaurant-outline", imgIconColor: "#B45309", ad: false },
  { id: "5", type: "listing", user: { name: "Chukwudi Eze", handle: "chuks_", initials: "CE", avatarBg: "#EDE9FE", avatarColor: "#4C1D95", dept: "CVE 300L" }, time: "1h", content: "AutoCAD & SolidWorks tutoring — weekends only. Helped 12 students pass their CAD exams last semester.", price: "₦3,000/session", tag: "Services", tagBg: "#EDE9FE", tagColor: "#4C1D95", likes: 56, comments: 11, saved: false, hasImage: false, ad: false },
  { id: "6", type: "ad", user: { name: "Nexwad Ads", handle: "sponsored", initials: "NX", avatarBg: "#FFF7ED", avatarColor: "#EA580C", dept: "" }, content: "Fast campus delivery now available! Enable delivery on your listings and reach more buyers across all hostels.", tag: "Sponsored", tagBg: "#FFF7ED", tagColor: "#EA580C", hasImage: false, ad: true, cta: "Enable Delivery" },
  { id: "7", type: "listing", user: { name: "Ngozi Alli", handle: "ngozi.alli", initials: "NA", avatarBg: "#F0F9FF", avatarColor: "#0369A1", dept: "MBA 100L" }, time: "2h", content: "Barely-used Casio fx-991EX scientific calculator. Battery replaced last month.", price: "₦5,500", tag: "Electronics", tagBg: "#FEF9C3", tagColor: "#854D0E", likes: 19, comments: 4, saved: false, hasImage: true, imgBg: "#F0F9FF", imgIcon: "calculator-outline", imgIconColor: "#0369A1", ad: false },
];

const STORIES = [
  { id: "1", name: "Your Story", initials: null, bg: "#F3F4F6", textColor: "#9CA3AF", isAdd: true },
  { id: "2", name: "Ada",    initials: "AO", bg: "#DCFCE7", textColor: "#15803D" },
  { id: "3", name: "Emeka",  initials: "EB", bg: "#FEF9C3", textColor: "#854D0E" },
  { id: "4", name: "Fatima", initials: "FY", bg: "#FCE7F3", textColor: "#9D174D" },
  { id: "5", name: "Chuks",  initials: "CE", bg: "#EDE9FE", textColor: "#4C1D95" },
  { id: "6", name: "Ngozi",  initials: "NA", bg: "#F0F9FF", textColor: "#0369A1" },
];

const SIDEBAR_ITEMS = [
  { icon: "home-outline",          label: "Home",          route: "/(tabs)/feed" },
  { icon: "compass-outline",       label: "Discover",      route: "/(tabs)/discover" },
  { icon: "storefront-outline",    label: "Marketplace",   route: "/(tabs)/marketplace" },
  { icon: "chatbubble-outline",    label: "Messages",      route: "/(tabs)/messages" },
  { icon: "notifications-outline", label: "Notifications", route: "/(tabs)/notifications", badge: 3 },
  { icon: "cube-outline",          label: "My Orders",     route: "/(tabs)/orders" },
  { icon: "bookmark-outline",      label: "Saved Items",   route: "/(tabs)/saved" },
  { icon: "settings-outline",      label: "Settings",      route: "/(tabs)/settings" },
];

const FILTERS = ["All", "Textbooks", "Electronics", "Food", "Services", "Fashion", "Housing"];

const FeedCard = ({ item, currentUserRole = "buyer" }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(item.saved);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [showMenu, setShowMenu] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const canEdit = currentUserRole === "premium" || currentUserRole === "seller";

  const handleLike = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.45, useNativeDriver: true, speed: 60 }),
      Animated.spring(heartScale, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
    setLiked(v => !v);
    setLikeCount(v => liked ? v - 1 : v + 1);
  };

  if (item.ad) {
    return (
      <View style={C.adCard}>
        <View style={C.adHeader}>
          <View style={[C.adAvatar, { backgroundColor: item.user.avatarBg }]}>
            <Ionicons name="sparkles" size={15} color={item.user.avatarColor} />
          </View>
          <View style={{ flex: 1 }}><Text style={[C.adName, { color: item.user.avatarColor }]}>{item.user.name}</Text></View>
          <View style={[C.pill, { backgroundColor: item.tagBg }]}><Text style={[C.pillTxt, { color: item.tagColor }]}>{item.tag}</Text></View>
        </View>
        <Text style={C.adBody}>{item.content}</Text>
        <TouchableOpacity style={C.adBtn} onPress={() => router.push("/(tabs)/pro-buyer")}>
          <Text style={C.adBtnTxt}>{item.cta}</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={C.card} activeOpacity={0.97} onPress={() => router.push({ pathname: "/(tabs)/listing-detail", params: { id: item.listingId || item.id } })}>
      <View style={C.cardHeader}>
        <View style={[C.avatar, { backgroundColor: item.user.avatarBg }]}>
          <Text style={[C.avatarTxt, { color: item.user.avatarColor }]}>{item.user.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <Text style={C.userName}>{item.user.name}</Text>
            <Text style={C.userHandle}> @{item.user.handle}</Text>
          </View>
          <Text style={C.userMeta}>{item.user.dept}{item.user.dept ? " · " : ""}{item.time} ago</Text>
        </View>
        <View style={[C.pill, { backgroundColor: item.tagBg }]}><Text style={[C.pillTxt, { color: item.tagColor }]}>{item.tag}</Text></View>
        <View>
          <TouchableOpacity onPress={() => setShowMenu(v => !v)} hitSlop={{top:8,bottom:8,left:8,right:8}} style={{ paddingLeft:4 }}>
            <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          {showMenu && (
            <View style={C.editMenu}>
              {canEdit && (
                <>
                  <TouchableOpacity style={C.editMenuItem} onPress={() => setShowMenu(false)}>
                    <Ionicons name="create-outline" size={14} color="#374151" /><Text style={C.editMenuTxt}>Edit post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={C.editMenuItem} onPress={() => setShowMenu(false)}>
                    <Ionicons name="trash-outline" size={14} color="#EF4444" /><Text style={[C.editMenuTxt, { color:"#EF4444" }]}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={C.editMenuItem} onPress={() => setShowMenu(false)}>
                <Ionicons name="flag-outline" size={14} color="#EF4444" /><Text style={[C.editMenuTxt, { color:"#EF4444" }]}>Report post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <Text style={C.body}>{item.content}</Text>
      {item.hasImage && (
        <View style={[C.imgBlock, { backgroundColor: item.imgBg }]}>
          <Ionicons name={item.imgIcon} size={54} color={item.imgIconColor} style={{ opacity: 0.3 }} />
          <View style={C.imgLabel}><Ionicons name="images-outline" size={11} color="#fff" /><Text style={C.imgLabelTxt}> View photos</Text></View>
        </View>
      )}
      <View style={C.cardFooter}>
        <View style={C.priceBadge}><Text style={C.priceText}>{item.price}</Text></View>
        <View style={C.actions}>
          <TouchableOpacity style={C.actionBtn} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? "#EF4444" : "#9CA3AF"} />
            </Animated.View>
            <Text style={[C.actionTxt, liked && { color: "#EF4444" }]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={C.actionBtn} onPress={() => router.push(`/(tabs)/comments?id=${item.id}&type=post`)}>
            <Ionicons name="chatbubble-outline" size={17} color="#9CA3AF" /><Text style={C.actionTxt}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={C.actionBtn} onPress={() => setSaved(v => !v)}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={17} color={saved ? "#1E3A8A" : "#9CA3AF"} />
          </TouchableOpacity>
          <TouchableOpacity style={C.addCartBtn} onPress={() => router.push("/(tabs)/cart")}>
            <Ionicons name="bag-add-outline" size={13} color="#fff" /><Text style={C.addCartTxt}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Sidebar = ({ visible, onClose, user }) => {
  const tx = useRef(new Animated.Value(-SCREEN_WIDTH * 0.78)).current;
  const bg = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(tx, { toValue: visible ? 0 : -SCREEN_WIDTH * 0.78, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(bg, { toValue: visible ? 1 : 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const initials = (user?.name || "U").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[S.backdrop, { opacity: bg }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[S.drawer, { transform: [{ translateX: tx }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={S.profileWrap}>
            <View style={S.avatarBig}><Text style={S.avatarBigTxt}>{initials}</Text></View>
            <Text style={S.pName}>{user?.name || "User"}</Text>
            <Text style={S.pHandle}>@{user?.username || ""}{user?.dept ? ` · ${user.dept}` : ""}</Text>
            <View style={S.statsRow}>
              {[
                [user?.totalListings || "0", "Listings"],
                [user?.rating        || "—", "Rating"  ],
                [user?.followers     || "0", "Followers"],
              ].map(([num, lbl], i, arr) => (
                <React.Fragment key={lbl}>
                  <View style={S.statItem}>
                    <Text style={S.statNum}>{num}</Text>
                    <Text style={S.statLbl}>{lbl}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={S.statDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
          <ScrollView style={{ flex: 1, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {SIDEBAR_ITEMS.map(item => (
              <TouchableOpacity key={item.label} style={S.navRow} onPress={() => { onClose(); router.push(item.route); }}>
                <Ionicons name={item.icon} size={20} color="#374151" />
                <Text style={S.navLbl}>{item.label}</Text>
                {item.badge && <View style={S.badge}><Text style={S.badgeTxt}>{item.badge}</Text></View>}
              </TouchableOpacity>
            ))}
            <View style={S.divider} />
            <TouchableOpacity style={S.sellerCard} onPress={() => { onClose(); router.push("/(tabs)/become-seller"); }}>
              <View style={S.sellerIconWrap}><Ionicons name="storefront-outline" size={22} color="#1E3A8A" /></View>
              <View style={{ flex: 1 }}>
                <Text style={S.sellerTitle}>Become a Seller</Text>
                <Text style={S.sellerSub}>Start earning on campus</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={S.proCard} onPress={() => { onClose(); router.push("/(tabs)/pro"); }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <Ionicons name="sparkles" size={13} color="#FCD34D" />
                <Text style={S.proTitle}>Upgrade to Nexwad Pro</Text>
              </View>
              <Text style={S.proSub}>Zero commission · Unlimited listings</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={S.signOut} onPress={() => { onClose(); router.replace("/Login"); }}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={S.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const TABS = [
  { key: "home",        iconFill: "home",       iconLine: "home-outline",       label: "Home",        route: "/(tabs)/feed" },
  { key: "discover",    iconFill: "compass",     iconLine: "compass-outline",    label: "Discover",    route: "/(tabs)/discover" },
  { key: "marketplace", iconFill: "storefront",  iconLine: "storefront-outline", label: "Marketplace", route: "/(tabs)/marketplace" },
  { key: "profile",     iconFill: "person",      iconLine: "person-outline",     label: "Profile",     route: "/(tabs)/profile" },
];

const BottomNav = ({ active }) => (
  <View style={N.bar}>
    {TABS.map(tab => {
      const on = tab.key === active;
      return (
        <TouchableOpacity key={tab.key} style={N.tab} onPress={() => router.push(tab.route)} activeOpacity={0.7}>
          {on && <View style={N.pip} />}
          <Ionicons name={on ? tab.iconFill : tab.iconLine} size={24} color={on ? "#F97316" : "#9CA3AF"} />
          <Text style={[N.lbl, on && N.lblOn]}>{tab.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const FloatingCart = ({ count }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 60 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 3 }),
    ]).start();
    router.push("/(tabs)/cart");
  };
  return (
    <Animated.View style={[F.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity style={F.btn} onPress={press} activeOpacity={1}>
        <Ionicons name="bag-outline" size={22} color="#fff" />
        {count > 0 && <View style={F.badge}><Text style={F.badgeTxt}>{count}</Text></View>}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Feed() {
  const { user } = useAuth();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [feedItems,    setFeedItems]    = useState(FEED_ITEMS);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page: 1, limit: 20, sort: "new" };
        if (activeFilter !== "All") params.category = activeFilter;
        const { listings } = await api.listings.list(params);
        const mapped = listings.map(l => ({
          id: l.id, type: "listing",
          user: {
            name: l.seller?.name || "Seller",
            handle: l.seller?.username || "seller",
            initials: (l.seller?.name || "S").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase(),
            avatarBg: "#DCFCE7", avatarColor: "#15803D",
            dept: l.seller?.dept || "",
          },
          time: new Date(l.createdAt).toLocaleDateString(),
          content: l.description || l.title,
          price: l.priceStr,
          tag: l.category,
          tagBg: "#DBEAFE", tagColor: "#1E3A8A",
          likes: l.likes, comments: l.comments, saved: false,
          hasImage: false, imgBg: "#DBEAFE",
          imgIcon: "pricetag-outline", imgIconColor: "#1E3A8A",
          ad: false, listingId: l.id,
        }));
        const ad = FEED_ITEMS.find(i => i.ad);
        setFeedItems(mapped.length > 0 ? [mapped[0], ad, ...mapped.slice(1)].filter(Boolean) : FEED_ITEMS);
      } catch (err) {
        console.log("[feed error]", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeFilter]);

  const filteredFeed = activeFilter === "All" ? feedItems : feedItems.filter(i => i.ad || i.tag === activeFilter);

  const ListHeader = () => (
    <View>
      <View style={feedSt.storiesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 14, paddingVertical: 10 }}>
          {STORIES.map(item => (
            <TouchableOpacity key={item.id} style={feedSt.storyItem} onPress={() => item.isAdd ? router.push("/(tabs)/story-create") : router.push(`/(tabs)/story/${item.id}`)}>
              <View style={[feedSt.storyRing, item.isAdd && feedSt.storyRingDash]}>
                <View style={[feedSt.storyInner, { backgroundColor: item.bg }]}>
                  {item.isAdd ? <Ionicons name="add" size={20} color="#9CA3AF" /> : <Text style={[feedSt.storyInit, { color: item.textColor }]}>{item.initials}</Text>}
                </View>
              </View>
              <Text style={feedSt.storyName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={feedSt.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingVertical: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[feedSt.chip, activeFilter === f && feedSt.chipOn]} onPress={() => setActiveFilter(f)}>
              <Text style={[feedSt.chipTxt, activeFilter === f && feedSt.chipTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={feedSt.feedBar}>
        <Text style={feedSt.feedBarTitle}>Campus Feed</Text>
        <TouchableOpacity style={feedSt.postBtn} onPress={() => router.push("/(tabs)/new-listing")}>
          <Ionicons name="add" size={14} color="#fff" /><Text style={feedSt.postBtnTxt}>Post Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={feedSt.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={feedSt.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
          <Ionicons name="menu" size={26} color="#111827" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row" }}>
          <Text style={feedSt.logoNex}>NEX</Text>
          <Text style={feedSt.logoWad}>WAD</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity style={feedSt.hBtn} onPress={() => router.push("/(tabs)/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#111827" /><View style={feedSt.dot} />
          </TouchableOpacity>
          <TouchableOpacity style={feedSt.hBtn} onPress={() => router.push("/(tabs)/search")}>
            <Ionicons name="search-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredFeed}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={<ListHeader />}
      />
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <FloatingCart count={2} />
      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const C = StyleSheet.create({
  card: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingHorizontal: 16, paddingVertical: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  userName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  userHandle: { fontSize: 13, color: "#9CA3AF" },
  userMeta: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pillTxt: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  body: { fontSize: 14, color: "#374151", lineHeight: 21, marginBottom: 12 },
  imgBlock: { height: 148, borderRadius: 14, marginBottom: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  imgLabel: { position: "absolute", bottom: 8, right: 10, backgroundColor: "rgba(0,0,0,0.38)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center" },
  imgLabelTxt: { fontSize: 10, color: "#fff", fontWeight: "600" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceBadge: { backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priceText: { fontSize: 14, fontWeight: "800", color: "#1E3A8A" },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionTxt: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  addCartBtn: { backgroundColor: "#F97316", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  addCartTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  editMenu: { position:"absolute", top:20, right:0, backgroundColor:"#fff", borderRadius:12, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:10, elevation:8, zIndex:100, minWidth:130 },
  editMenuItem: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:14, paddingVertical:11, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  editMenuTxt: { fontSize:13, fontWeight:"600", color:"#374151" },
  adCard: { backgroundColor: "#FFFBF7", borderBottomWidth: 1, borderBottomColor: "#FED7AA", paddingHorizontal: 16, paddingVertical: 14, borderLeftWidth: 3, borderLeftColor: "#F97316" },
  adHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  adAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#FED7AA" },
  adName: { fontSize: 13, fontWeight: "700" },
  adBody: { fontSize: 14, color: "#374151", lineHeight: 21, marginBottom: 12 },
  adBtn: { alignSelf: "flex-start", backgroundColor: "#F97316", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  adBtnTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

const S = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  drawer: { position: "absolute", top: 0, left: 0, bottom: 0, width: SCREEN_WIDTH * 0.78, backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  profileWrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  avatarBig: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarBigTxt: { fontSize: 18, fontWeight: "800", color: "#15803D" },
  pName: { fontSize: 17, fontWeight: "800", color: "#111827" },
  pHandle: { fontSize: 12, color: "#9CA3AF", marginTop: 2, marginBottom: 14 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 14, fontWeight: "800", color: "#111827" },
  statLbl: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: "#F3F4F6" },
  navRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 13, gap: 14 },
  navLbl: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  badge: { backgroundColor: "#F97316", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeTxt: { fontSize: 11, fontWeight: "800", color: "#fff" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 20, marginVertical: 8 },
  sellerCard: { marginHorizontal: 16, marginVertical: 6, borderRadius: 16, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  sellerIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  sellerTitle: { fontSize: 14, fontWeight: "800", color: "#1E3A8A" },
  sellerSub: { fontSize: 11, color: "#3B82F6", marginTop: 1 },
  proCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, borderRadius: 16, backgroundColor: "#1E3A8A", padding: 14 },
  proTitle: { fontSize: 13, fontWeight: "800", color: "#FFF7ED" },
  proSub: { fontSize: 11, color: "#93C5FD" },
  signOut: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  signOutTxt: { fontSize: 14, color: "#EF4444", fontWeight: "600" },
});

const N = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingBottom: Platform.OS === "ios" ? 20 : 8, paddingTop: 8, paddingHorizontal: 8, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10 },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4, position: "relative" },
  pip: { position: "absolute", top: -8, width: 28, height: 3, borderRadius: 2, backgroundColor: "#F97316" },
  lbl: { fontSize: 10, color: "#9CA3AF", fontWeight: "500", marginTop: 2 },
  lblOn: { color: "#F97316", fontWeight: "700" },
});

const F = StyleSheet.create({
  wrap: { position: "absolute", bottom: Platform.OS === "ios" ? 92 : 76, right: 16, zIndex: 100 },
  btn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 12 },
  badge: { position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  badgeTxt: { fontSize: 9, fontWeight: "900", color: "#fff" },
});

const feedSt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  logoNex: { fontSize: 22, fontWeight: "900", color: "#1E3A8A", letterSpacing: -0.5 },
  logoWad: { fontSize: 22, fontWeight: "900", color: "#F97316", letterSpacing: -0.5 },
  hBtn: { padding: 6, position: "relative" },
  dot: { position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: "#F97316", borderWidth: 1.5, borderColor: "#fff" },
  storiesRow: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  storyItem: { alignItems: "center", gap: 4 },
  storyRing: { padding: 2.5, borderRadius: 27, borderWidth: 2, borderColor: "#F97316" },
  storyRingDash: { borderColor: "#D1D5DB", borderStyle: "dashed" },
  storyInner: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  storyInit: { fontSize: 13, fontWeight: "800" },
  storyName: { fontSize: 10, color: "#6B7280", fontWeight: "500" },
  filterRow: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" },
  chipOn: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTxtOn: { color: "#fff" },
  feedBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  feedBarTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  postBtn: { backgroundColor: "#F97316", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  postBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
});