// app/seller/[id].jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, ScrollView, FlatList, Dimensions, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";
const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

// ─── SELLER DATA ──────────────────────────────────────────────────────────────

const SELLERS = {
  s1: {
    id:"s1", name:"Adaeze Okonkwo", handle:"ada_sells", initials:"AO",
    bg:"#DCFCE7", color:"#15803D", dept:"Computer Science", level:"300L",
    bio:"CSC student. Selling textbooks, notes & coding tutoring. Fast responses, campus delivery available.",
    rating:4.9, reviews:28, sales:38, listings:12, followers:48, verified:true,
    joined:"Jan 2024", responseTime:"~10 mins", tags:["Textbooks","Services","Stationery"],
    achievements:[
      { icon:"star",          color:"#F59E0B", label:"Top Rated"    },
      { icon:"ribbon",        color:"#1E3A8A", label:"Verified"     },
      { icon:"trending-up",   color:"#15803D", label:"38 Sales"     },
    ],
  },
  s2: {
    id:"s2", name:"Emeka Balogun", handle:"emeka.b", initials:"EB",
    bg:"#FEF9C3", color:"#854D0E", dept:"Electrical Engineering", level:"400L",
    bio:"EEE finalist. Gadgets, chargers and electronics. All items tested before sale.",
    rating:4.8, reviews:7, sales:52, listings:8, followers:31, verified:true,
    joined:"Mar 2024", responseTime:"~25 mins", tags:["Electronics","Housing"],
    achievements:[
      { icon:"ribbon",        color:"#1E3A8A", label:"Verified"     },
      { icon:"trending-up",   color:"#15803D", label:"52 Sales"     },
    ],
  },
  s3: {
    id:"s3", name:"Fatima Yusuf", handle:"fatimay", initials:"FY",
    bg:"#FCE7F3", color:"#9D174D", dept:"Mechanical Engineering", level:"200L",
    bio:"Home-cooked meals daily. Jollof rice, shawarma & more. Order by 11am for 1pm delivery.",
    rating:5.0, reviews:34, sales:91, listings:5, followers:112, verified:true,
    joined:"Sep 2023", responseTime:"~5 mins", tags:["Food"],
    achievements:[
      { icon:"star",          color:"#F59E0B", label:"Top Rated"    },
      { icon:"ribbon",        color:"#1E3A8A", label:"Verified"     },
      { icon:"trophy",        color:"#F97316", label:"91 Sales"     },
      { icon:"heart",         color:"#EF4444", label:"Most Loved"   },
    ],
  },
  s4: {
    id:"s4", name:"Chukwudi Eze", handle:"chuks.e", initials:"CE",
    bg:"#EDE9FE", color:"#4C1D95", dept:"Civil Engineering", level:"300L",
    bio:"AutoCAD, SolidWorks & drawing set sales. Weekends available for tutoring sessions.",
    rating:4.7, reviews:11, sales:27, listings:9, followers:22, verified:false,
    joined:"Feb 2024", responseTime:"~1 hr", tags:["Services","Stationery"],
    achievements:[
      { icon:"trending-up",   color:"#15803D", label:"27 Sales"     },
    ],
  },
  s5: {
    id:"s5", name:"Ngozi Alli", handle:"ngozi.a", initials:"NA",
    bg:"#F0F9FF", color:"#0369A1", dept:"Business Administration", level:"100L",
    bio:"Electronics and textbook seller. Quick delivery, fair prices.",
    rating:4.9, reviews:19, sales:44, listings:14, followers:37, verified:true,
    joined:"Oct 2023", responseTime:"~15 mins", tags:["Electronics","Textbooks"],
    achievements:[
      { icon:"star",          color:"#F59E0B", label:"Top Rated"    },
      { icon:"ribbon",        color:"#1E3A8A", label:"Verified"     },
      { icon:"trending-up",   color:"#15803D", label:"44 Sales"     },
    ],
  },
};

const DEFAULT_SELLER = SELLERS.s1;

// ─── LISTING DATA PER SELLER ──────────────────────────────────────────────────

const SELLER_LISTINGS = {
  s1: [
    { id:"p1",  title:"Stroud Maths 7th Ed",         price:"₦4,500",  imgBg:"#DBEAFE", imgIcon:"book-outline",       imgColor:"#1E3A8A", tag:"Textbooks",  tagBg:"#DBEAFE", tagColor:"#1E3A8A", status:"active" },
    { id:"p9",  title:"Python Tutoring (Weekends)",   price:"₦2,500",  imgBg:"#EDE9FE", imgIcon:"code-slash-outline", imgColor:"#4C1D95", tag:"Services",   tagBg:"#EDE9FE", tagColor:"#4C1D95", status:"active" },
    { id:"p6",  title:"Second-hand Polo Set",         price:"₦2,200",  imgBg:"#DCFCE7", imgIcon:"shirt-outline",      imgColor:"#15803D", tag:"Fashion",    tagBg:"#DCFCE7", tagColor:"#15803D", status:"active" },
    { id:"p8",  title:"Engineering Drawing Set",      price:"₦3,800",  imgBg:"#F0F9FF", imgIcon:"pencil-outline",     imgColor:"#0369A1", tag:"Stationery", tagBg:"#F0F9FF", tagColor:"#0369A1", status:"active" },
  ],
  s2: [
    { id:"p2",  title:"HP 65W USB-C Charger",         price:"₦6,000",  imgBg:"#FEF9C3", imgIcon:"flash-outline",      imgColor:"#854D0E", tag:"Electronics",tagBg:"#FEF9C3", tagColor:"#854D0E", status:"active" },
    { id:"p11", title:"JBL Tune 120 Earbuds",         price:"₦9,500",  imgBg:"#FEF9C3", imgIcon:"headset-outline",    imgColor:"#854D0E", tag:"Electronics",tagBg:"#FEF9C3", tagColor:"#854D0E", status:"active" },
    { id:"p7",  title:"Off-campus Room for Sublet",   price:"₦18,000", imgBg:"#FFF7ED", imgIcon:"home-outline",       imgColor:"#EA580C", tag:"Housing",    tagBg:"#FFF7ED", tagColor:"#EA580C", status:"active" },
  ],
  s3: [
    { id:"p3",  title:"Jollof Rice + Protein",        price:"₦800",    imgBg:"#FEF3C7", imgIcon:"restaurant-outline", imgColor:"#B45309", tag:"Food",       tagBg:"#FCE7F3", tagColor:"#9D174D", status:"active" },
    { id:"p12", title:"Shawarma (Chicken / Beef)",    price:"₦1,200",  imgBg:"#FCE7F3", imgIcon:"fast-food-outline",  imgColor:"#9D174D", tag:"Food",       tagBg:"#FCE7F3", tagColor:"#9D174D", status:"active" },
  ],
  s4: [
    { id:"p4",  title:"AutoCAD Tutoring",             price:"₦3,000",  imgBg:"#EDE9FE", imgIcon:"desktop-outline",    imgColor:"#4C1D95", tag:"Services",   tagBg:"#EDE9FE", tagColor:"#4C1D95", status:"active" },
    { id:"p8",  title:"Engineering Drawing Set",      price:"₦3,800",  imgBg:"#F0F9FF", imgIcon:"pencil-outline",     imgColor:"#0369A1", tag:"Stationery", tagBg:"#F0F9FF", tagColor:"#0369A1", status:"active" },
  ],
  s5: [
    { id:"p5",  title:"Casio fx-991EX Calculator",   price:"₦5,500",  imgBg:"#F0F9FF", imgIcon:"calculator-outline", imgColor:"#0369A1", tag:"Electronics",tagBg:"#FEF9C3", tagColor:"#854D0E", status:"active" },
    { id:"p10", title:"Mechanics of Materials",       price:"₦3,200",  imgBg:"#DBEAFE", imgIcon:"book-outline",       imgColor:"#1E3A8A", tag:"Textbooks",  tagBg:"#DBEAFE", tagColor:"#1E3A8A", status:"active" },
  ],
};

const REVIEWS = [
  { id:"r1", reviewer:"Emeka B.",    initials:"EB", bg:"#FEF9C3", color:"#854D0E", rating:5, comment:"Super fast, item exactly as described. Will buy again!",       time:"2d ago" },
  { id:"r2", reviewer:"Fatima Y.",   initials:"FY", bg:"#FCE7F3", color:"#9D174D", rating:5, comment:"Great seller, very responsive. Textbook in perfect condition.", time:"1w ago" },
  { id:"r3", reviewer:"Chukwudi E.", initials:"CE", bg:"#EDE9FE", color:"#4C1D95", rating:4, comment:"Good transaction overall. Slight delay but communicated well.",  time:"2w ago" },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const Stars = ({ rating, size = 12 }) => (
  <View style={{ flexDirection:"row", gap:2 }}>
    {Array.from({ length:5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : i === Math.floor(rating) && rating % 1 >= 0.5 ? "star-half" : "star-outline"}
        size={size}
        color={i < Math.ceil(rating) ? "#F59E0B" : "#D1D5DB"}
      />
    ))}
  </View>
);

const ListingCard = ({ item, index, accentColor }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:320, delay:index*60, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:320, delay:index*60, useNativeDriver:true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}], width:CARD_W }}>
      <TouchableOpacity style={LC.card} activeOpacity={0.92} onPress={() => router.push(`/listing/${item.id}`)}>
        <View style={[LC.img, { backgroundColor:item.imgBg }]}>
          <Ionicons name={item.imgIcon} size={34} color={item.imgColor} style={{ opacity:0.28 }} />
        </View>
        <View style={LC.info}>
          <View style={[LC.tag, { backgroundColor:item.tagBg }]}>
            <Text style={[LC.tagTxt, { color:item.tagColor }]}>{item.tag}</Text>
          </View>
          <Text style={LC.title} numberOfLines={2}>{item.title}</Text>
          <View style={LC.footer}>
            <Text style={[LC.price, { color:accentColor }]}>{item.price}</Text>
            <TouchableOpacity style={[LC.addBtn, { backgroundColor:accentColor }]} onPress={() => router.push("/cart")}>
              <Ionicons name="bag-add-outline" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const LC = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, overflow:"hidden", borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:3, marginBottom:16 },
  img: { height:96, alignItems:"center", justifyContent:"center" },
  info: { padding:10 },
  tag: { alignSelf:"flex-start", paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginBottom:4 },
  tagTxt: { fontSize:9, fontWeight:"700" },
  title: { fontSize:12, fontWeight:"700", color:"#111827", lineHeight:17, marginBottom:7 },
  footer: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  price: { fontSize:13, fontWeight:"800" },
  addBtn: { width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center" },
});

const ReviewCard = ({ item }) => (
  <View style={RC.card}>
    <View style={RC.header}>
      <View style={[RC.avatar, { backgroundColor:item.bg }]}>
        <Text style={[RC.avatarTxt, { color:item.color }]}>{item.initials}</Text>
      </View>
      <View style={{ flex:1 }}>
        <Text style={RC.name}>{item.reviewer}</Text>
        <Stars rating={item.rating} size={11} />
      </View>
      <Text style={RC.time}>{item.time}</Text>
    </View>
    <Text style={RC.comment}>{item.comment}</Text>
  </View>
);

const RC = StyleSheet.create({
  card: { backgroundColor:"#fff", borderRadius:18, padding:14, borderWidth:1, borderColor:"#F3F4F6", marginBottom:12, shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  header: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 },
  avatar: { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:11, fontWeight:"800" },
  name: { fontSize:13, fontWeight:"700", color:"#111827", marginBottom:3 },
  time: { fontSize:11, color:"#9CA3AF" },
  comment: { fontSize:13, color:"#374151", lineHeight:20 },
});

// ─── MAIN SELLER PROFILE ──────────────────────────────────────────────────────
export default function SellerProfile() {
  const { id } = useLocalSearchParams();
  const [seller,    setSeller]   = useState(DEFAULT_SELLER);
  const [listings,  setListings] = useState([]);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("listings");
  const [saved,     setSaved]    = useState(false);
  const [showMenu,  setShowMenu] = useState(false);
  const [reported,  setReported] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { seller: s } = await api.sellers.get(id);
        if (s) {
          setSeller({
            id: s.id, name: s.name || "Seller", handle: s.username || id,
            initials: (s.name||"S").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase(),
            bg: "#DBEAFE", color: "#1E3A8A", dept: s.dept || "", level: "",
            bio: s.bio || "", rating: s.rating || 0, reviews: s.totalReviews || 0,
            sales: s.totalSales || 0, listings: 0, followers: s.followers || 0,
            verified: s.isVerified || false, joined: "", responseTime: "~10 mins",
            tags: [], achievements: s.isVerified ? [{ icon:"ribbon", color:"#1E3A8A", label:"Verified" }] : [],
          });
          const { listings: l } = await api.listings.bySeller(s.id);
          setListings((l || []).map(item => ({
            ...item, price: item.priceStr, imgBg: "#DBEAFE",
            imgIcon: "pricetag-outline", imgColor: "#1E3A8A",
            tag: item.category, tagBg: "#DBEAFE", tagColor: "#1E3A8A",
          })));
        }
      } catch (err) {
        console.log("[seller load]", err.message);
      }
    };
    load();
  }, [id]);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(-20)).current;
  const tabLine     = useRef(new Animated.Value(0)).current;
  const followScale = useRef(new Animated.Value(1)).current;
  const TAB_W       = (W - 32) / 2;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:480, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:480, useNativeDriver:true }),
    ]).start();
  }, []);

  const handleFollow = () => {
    Animated.sequence([
      Animated.spring(followScale, { toValue:0.92, useNativeDriver:true, speed:60 }),
      Animated.spring(followScale, { toValue:1,    useNativeDriver:true, friction:3 }),
    ]).start();
    setFollowing(v => !v);
  };

  const switchTab = (key) => {
    const idx = key === "listings" ? 0 : 1;
    Animated.spring(tabLine, { toValue:idx * TAB_W, useNativeDriver:true, damping:20, stiffness:200 }).start();
    setActiveTab(key);
  };

  const rows = [];
  for (let i = 0; i < listings.length; i += 2) rows.push(listings.slice(i, i+2));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Seller Profile</Text>
        <View style={{ flexDirection:"row", gap:4, alignItems:"center" }}>
          <TouchableOpacity onPress={() => setSaved(v => !v)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color={saved ? "#1E3A8A" : "#111827"} />
          </TouchableOpacity>
          <View>
            <TouchableOpacity onPress={() => setShowMenu(v => !v)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
            </TouchableOpacity>
            {showMenu && (
              <View style={s.reportMenu}>
                <TouchableOpacity style={s.reportMenuItem} onPress={() => setShowMenu(false)}>
                  <Ionicons name="share-social-outline" size={15} color="#374151" />
                  <Text style={s.reportMenuTxt}>Share profile</Text>
                </TouchableOpacity>
                {!reported ? (
                  <TouchableOpacity style={s.reportMenuItem} onPress={() => { setReported(true); setShowMenu(false); }}>
                    <Ionicons name="flag-outline" size={15} color="#EF4444" />
                    <Text style={[s.reportMenuTxt, { color:"#EF4444" }]}>Report seller</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.reportMenuItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#15803D" />
                    <Text style={[s.reportMenuTxt, { color:"#15803D" }]}>Reported</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:60 }}>
        <Animated.View style={{ opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

          {/* ── Hero Card ── */}
          <View style={s.heroCard}>
            {/* Banner */}
            <View style={[s.banner, { backgroundColor:seller.color }]}>
              {/* decorative circles */}
              <View style={s.bannerCircle1} />
              <View style={s.bannerCircle2} />
            </View>

            {/* Avatar */}
            <View style={s.avatarRow}>
              <View style={s.avatarWrap}>
                <View style={[s.avatar, { backgroundColor:seller.bg }]}>
                  <Text style={[s.avatarTxt, { color:seller.color }]}>{seller.initials}</Text>
                </View>
                {seller.verified && (
                  <View style={[s.verifiedBadge, { backgroundColor:seller.color }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.msgBtn} onPress={() => router.push("/messages")}>
                  <Ionicons name="chatbubble-outline" size={17} color="#1E3A8A" />
                  <Text style={s.msgBtnTxt}>Message</Text>
                </TouchableOpacity>
                <Animated.View style={{ transform:[{scale:followScale}] }}>
                  <TouchableOpacity
                    style={[s.followBtn, following && { backgroundColor:seller.color, borderColor:seller.color }]}
                    onPress={handleFollow}
                  >
                    <Text style={[s.followTxt, following && { color:"#fff" }]}>
                      {following ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Identity */}
            <View style={s.identity}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                <Text style={s.name}>{seller.name}</Text>
                {seller.verified && (
                  <View style={[s.proTag, { backgroundColor:seller.bg, borderColor:seller.color+"33" }]}>
                    <Ionicons name="ribbon" size={10} color={seller.color} />
                    <Text style={[s.proTagTxt, { color:seller.color }]}>Verified Seller</Text>
                  </View>
                )}
              </View>
              <Text style={s.handle}>@{seller.handle}</Text>
              <View style={s.deptRow}>
                <Ionicons name="school-outline" size={12} color="#9CA3AF" />
                <Text style={s.dept}>{seller.dept} · {seller.level}</Text>
              </View>
              <Text style={s.bio}>{seller.bio}</Text>
            </View>

            {/* Tags */}
            <View style={s.tagsRow}>
              {seller.tags.map(tag => (
                <View key={tag} style={s.tagChip}>
                  <Text style={s.tagChipTxt}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Quick info strip */}
            <View style={s.infoStrip}>
              <View style={s.infoItem}>
                <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                <Text style={s.infoTxt}>Replies in {seller.responseTime}</Text>
              </View>
              <View style={s.infoItem}>
                <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                <Text style={s.infoTxt}>Since {seller.joined}</Text>
              </View>
            </View>

            {/* Rating strip */}
            <View style={s.ratingStrip}>
              <Stars rating={seller.rating} size={14} />
              <Text style={s.ratingNum}>{seller.rating}</Text>
              <Text style={s.ratingReviews}>({seller.reviews} reviews)</Text>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              {[
                { num:seller.sales,     label:"Sales"     },
                { num:seller.listings,  label:"Listings"  },
                { num:seller.followers, label:"Followers" },
              ].map((stat, i, arr) => (
                <React.Fragment key={stat.label}>
                  <View style={s.statItem}>
                    <Text style={[s.statNum, { color:seller.color }]}>{stat.num}</Text>
                    <Text style={s.statLbl}>{stat.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={s.statDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* Achievements */}
            {seller.achievements.length > 0 && (
              <View style={s.achieveRow}>
                {seller.achievements.map(a => (
                  <View key={a.label} style={s.achieveChip}>
                    <Ionicons name={a.icon} size={12} color={a.color} />
                    <Text style={[s.achieveTxt, { color:a.color }]}>{a.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Tabs ── */}
          <View style={s.tabsWrap}>
            <View style={s.tabsRow}>
              {[
                { key:"listings", label:"Listings", icon:"grid",     iconOff:"grid-outline"     },
                { key:"reviews",  label:"Reviews",  icon:"star",     iconOff:"star-outline"     },
              ].map(tab => {
                const on = activeTab === tab.key;
                return (
                  <TouchableOpacity key={tab.key} style={s.tabBtn} onPress={() => switchTab(tab.key)}>
                    <Ionicons name={on ? tab.icon : tab.iconOff} size={15} color={on ? seller.color : "#9CA3AF"} />
                    <Text style={[s.tabTxt, on && { color:seller.color, fontWeight:"700" }]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Animated.View style={[s.tabLine, { backgroundColor:seller.color, width:TAB_W, transform:[{translateX:tabLine}] }]} />
          </View>

          {/* ── Tab Content ── */}
          <View style={s.content}>
            {activeTab === "listings" && (
              listings.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                  <Text style={s.emptyTitle}>No listings yet</Text>
                </View>
              ) : (
                rows.map((row, ri) => (
                  <View key={ri} style={s.gridRow}>
                    {row.map((item, ci) => (
                      <ListingCard key={item.id} item={item} index={ri*2+ci} accentColor={seller.color} />
                    ))}
                    {row.length === 1 && <View style={{ width:CARD_W }} />}
                  </View>
                ))
              )
            )}

            {activeTab === "reviews" && (
              <View>
                {/* Summary */}
                <View style={s.reviewSummary}>
                  <View style={s.bigRating}>
                    <Text style={[s.bigRatingNum, { color:seller.color }]}>{seller.rating}</Text>
                    <Stars rating={seller.rating} size={16} />
                    <Text style={s.bigRatingSub}>{seller.reviews} reviews</Text>
                  </View>
                  <View style={s.ratingBars}>
                    {[5,4,3,2,1].map(star => {
                      const pct = star===5?72:star===4?18:star===3?7:star===2?2:1;
                      return (
                        <View key={star} style={s.barRow}>
                          <Text style={s.barLabel}>{star}</Text>
                          <Ionicons name="star" size={9} color="#F59E0B" />
                          <View style={s.barTrack}>
                            <View style={[s.barFill, { width:`${pct}%`, backgroundColor:seller.color }]} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
                {REVIEWS.map(r => <ReviewCard key={r.id} item={r} />)}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingVertical:12, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6" },
  reportMenu: { position:"absolute", top:28, right:0, backgroundColor:"#fff", borderRadius:14, borderWidth:1, borderColor:"#F3F4F6", shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:10, elevation:10, zIndex:100, minWidth:160 },
  reportMenuItem: { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F9FAFB" },
  reportMenuTxt: { fontSize:13, fontWeight:"600", color:"#374151" },
  headerTitle: { fontSize:16, fontWeight:"800", color:"#111827" },

  heroCard: { backgroundColor:"#fff", marginBottom:8, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },

  banner: { height:88, position:"relative", overflow:"hidden" },
  bannerCircle1: { position:"absolute", width:120, height:120, borderRadius:60, backgroundColor:"rgba(255,255,255,0.08)", top:-40, right:-20 },
  bannerCircle2: { position:"absolute", width:80,  height:80,  borderRadius:40, backgroundColor:"rgba(255,255,255,0.08)", bottom:-30, left:20 },

  avatarRow: { flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between", paddingHorizontal:16, marginTop:-30, marginBottom:10 },
  avatarWrap: { position:"relative" },
  avatar: { width:68, height:68, borderRadius:34, alignItems:"center", justifyContent:"center", borderWidth:3, borderColor:"#fff" },
  avatarTxt: { fontSize:22, fontWeight:"900" },
  verifiedBadge: { position:"absolute", bottom:2, right:2, width:20, height:20, borderRadius:10, alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#fff" },
  actionsRow: { flexDirection:"row", alignItems:"center", gap:8 },
  msgBtn: { flexDirection:"row", alignItems:"center", gap:5, borderWidth:1.5, borderColor:"#BFDBFE", backgroundColor:"#EFF6FF", paddingHorizontal:13, paddingVertical:8, borderRadius:14 },
  msgBtnTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },
  followBtn: { borderWidth:1.5, borderColor:"#1E3A8A", paddingHorizontal:16, paddingVertical:8, borderRadius:14 },
  followTxt: { fontSize:12, fontWeight:"700", color:"#1E3A8A" },

  identity: { paddingHorizontal:16, paddingBottom:10 },
  name: { fontSize:20, fontWeight:"900", color:"#111827", letterSpacing:-0.4 },
  proTag: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:10, borderWidth:1 },
  proTagTxt: { fontSize:10, fontWeight:"700" },
  handle: { fontSize:13, color:"#9CA3AF", marginTop:2, marginBottom:4 },
  deptRow: { flexDirection:"row", alignItems:"center", gap:4, marginBottom:6 },
  dept: { fontSize:12, color:"#9CA3AF" },
  bio: { fontSize:13, color:"#374151", lineHeight:20 },

  tagsRow: { flexDirection:"row", flexWrap:"wrap", gap:7, paddingHorizontal:16, marginBottom:12 },
  tagChip: { backgroundColor:"#F3F4F6", paddingHorizontal:10, paddingVertical:4, borderRadius:10 },
  tagChipTxt: { fontSize:11, fontWeight:"600", color:"#6B7280" },

  infoStrip: { flexDirection:"row", gap:16, paddingHorizontal:16, paddingBottom:10 },
  infoItem: { flexDirection:"row", alignItems:"center", gap:4 },
  infoTxt: { fontSize:11, color:"#9CA3AF" },

  ratingStrip: { flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:16, paddingVertical:10, borderTopWidth:1, borderTopColor:"#F9FAFB" },
  ratingNum: { fontSize:13, fontWeight:"800", color:"#111827" },
  ratingReviews: { fontSize:12, color:"#9CA3AF" },

  statsRow: { flexDirection:"row", alignItems:"center", paddingVertical:14, paddingHorizontal:16, borderTopWidth:1, borderTopColor:"#F9FAFB" },
  statItem: { flex:1, alignItems:"center" },
  statNum: { fontSize:20, fontWeight:"900" },
  statLbl: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  statDivider: { width:1, height:30, backgroundColor:"#F3F4F6" },

  achieveRow: { flexDirection:"row", flexWrap:"wrap", gap:7, paddingHorizontal:16, paddingBottom:16, borderTopWidth:1, borderTopColor:"#F9FAFB", paddingTop:12 },
  achieveChip: { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#F9FAFB", paddingHorizontal:10, paddingVertical:5, borderRadius:12, borderWidth:1, borderColor:"#F3F4F6" },
  achieveTxt: { fontSize:11, fontWeight:"700" },

  tabsWrap: { backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F3F4F6", marginBottom:8 },
  tabsRow: { flexDirection:"row" },
  tabBtn: { flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, paddingVertical:13 },
  tabTxt: { fontSize:13, fontWeight:"600", color:"#9CA3AF" },
  tabLine: { height:2.5, borderRadius:2, marginLeft:16 },

  content: { paddingHorizontal:16, paddingTop:4 },
  gridRow: { flexDirection:"row", gap:16 },

  reviewSummary: { flexDirection:"row", gap:16, backgroundColor:"#fff", borderRadius:18, padding:16, marginBottom:16, borderWidth:1, borderColor:"#F3F4F6" },
  bigRating: { alignItems:"center", justifyContent:"center", gap:4, minWidth:72 },
  bigRatingNum: { fontSize:38, fontWeight:"900", letterSpacing:-1 },
  bigRatingSub: { fontSize:11, color:"#9CA3AF", marginTop:2 },
  ratingBars: { flex:1, gap:6, justifyContent:"center" },
  barRow: { flexDirection:"row", alignItems:"center", gap:5 },
  barLabel: { fontSize:11, color:"#6B7280", width:8, textAlign:"right" },
  barTrack: { flex:1, height:6, backgroundColor:"#F3F4F6", borderRadius:3, overflow:"hidden" },
  barFill: { height:"100%", borderRadius:3 },

  empty: { alignItems:"center", paddingTop:40, gap:8 },
  emptyTitle: { fontSize:15, fontWeight:"600", color:"#9CA3AF" },
});
