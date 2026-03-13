# Wire feed.jsx to real API
# Run from: C:\Users\DARAKU\Desktop\NEX_WAD\nexwad-app

Write-Host "Wiring feed.jsx..." -ForegroundColor Cyan

$file = "app\(tabs)\feed.jsx"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Add API import after the last existing import line
$oldImport = 'const { width: SCREEN_WIDTH } = Dimensions.get("window");'
$newImport = 'const { width: SCREEN_WIDTH } = Dimensions.get("window");
import api from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";'
$content = $content.Replace($oldImport, $newImport)

# 2. Replace the Feed component state setup to add API data
$oldState = 'export default function Feed() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const filteredFeed = activeFilter === "All"
    ? FEED_ITEMS
    : FEED_ITEMS.filter((i) => i.ad || i.tag === activeFilter);'

$newState = 'export default function Feed() {
  const { user } = useAuth();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [feedItems,    setFeedItems]    = useState(FEED_ITEMS); // start with mock, replace with real
  const [loading,      setLoading]      = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);

  // Load real listings from API
  useEffect(() => {
    loadFeed(1);
  }, [activeFilter]);

  const loadFeed = async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 20, sort: "new" };
      if (activeFilter !== "All") params.category = activeFilter;
      const { listings, pagination } = await api.listings.list(params);

      // Map API listing shape to feed card shape
      const mapped = listings.map(l => ({
        id:        l.id,
        type:      "listing",
        user: {
          name:        l.seller?.name || "Seller",
          handle:      l.seller?.username || "seller",
          initials:    (l.seller?.name || "S").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase(),
          avatarBg:    "#DCFCE7",
          avatarColor: "#15803D",
          dept:        l.seller?.dept || "",
        },
        time:         new Date(l.createdAt).toLocaleDateString(),
        content:      l.description || l.title,
        price:        l.priceStr,
        tag:          l.category,
        tagBg:        "#DBEAFE",
        tagColor:     "#1E3A8A",
        likes:        l.likes,
        comments:     l.comments,
        saved:        l.isSaved || false,
        hasImage:     l.images?.length > 0,
        imgUrl:       l.images?.[0] || null,
        imgBg:        "#DBEAFE",
        imgIcon:      "pricetag-outline",
        imgIconColor: "#1E3A8A",
        ad:           false,
        listingId:    l.id,
      }));

      if (pageNum === 1) {
        // Keep one ad at position 2 for monetization
        const withAd = [...mapped.slice(0,1), FEED_ITEMS.find(i => i.ad), ...mapped.slice(1)].filter(Boolean);
        setFeedItems(withAd);
      } else {
        setFeedItems(prev => [...prev, ...mapped]);
      }
      setPage(pageNum);
      setHasMore(pageNum < Math.ceil(pagination.total / 20));
    } catch (err) {
      console.log("[feed]", err.message);
      // Keep showing mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  const filteredFeed = activeFilter === "All"
    ? feedItems
    : feedItems.filter((i) => i.ad || i.tag === activeFilter);'

$content = $content.Replace($oldState, $newState)

# Save the file
$content | Set-Content $file -Encoding UTF8

Write-Host "feed.jsx wired!" -ForegroundColor Green
Write-Host ""
Write-Host "The feed will now:" -ForegroundColor Yellow
Write-Host "  - Load real listings from your database on startup"
Write-Host "  - Filter by category using real API"
Write-Host "  - Fall back to mock data if the API is unreachable"
Write-Host "  - Keep the ad card for monetization"
Write-Host ""
Write-Host "Restart Expo to see changes: npx expo start --clear" -ForegroundColor Cyan
