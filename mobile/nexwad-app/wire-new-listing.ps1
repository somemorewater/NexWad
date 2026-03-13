# Wire new-listing.jsx to real API
# Run from: C:\Users\DARAKU\Desktop\NEX_WAD\nexwad-app

Write-Host "Wiring new-listing.jsx..." -ForegroundColor Cyan

$file = "app\(tabs)\new-listing.jsx"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Add API import after Ionicons import
$oldImport = 'import { Ionicons } from "@expo/vector-icons";'
$newImport = 'import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import api from "../../src/api/client";'
$content = $content.Replace($oldImport, $newImport)

# 2. Replace handlePublish with real API call
$oldPublish = '  const handlePublish = () => {
    if (!isReady) return;
    setPublished(true);
    Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
    setTimeout(() => router.replace("/seller-dashboard"), 2400);
  };'

$newPublish = '  const [submitting, setSubmitting] = useState(false);

  const handlePublish = async () => {
    if (!isReady || submitting) return;
    setSubmitting(true);
    try {
      await api.listings.create({
        title:       title.trim(),
        description: desc.trim(),
        price:       parseFloat(price.replace(/[^0-9.]/g, "")),
        category:    category,
        delivery:    delivery ? "both" : "pickup",
      });
      setPublished(true);
      Animated.spring(doneScale, { toValue:1, useNativeDriver:true, damping:14, stiffness:160 }).start();
      setTimeout(() => router.replace("/(tabs)/seller-dashboard"), 2400);
    } catch (err) {
      Alert.alert("Failed to publish", err.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  };'

$content = $content.Replace($oldPublish, $newPublish)

# Save
$content | Set-Content $file -Encoding UTF8

Write-Host "new-listing.jsx wired!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: To post listings you need a seller account." -ForegroundColor Yellow
Write-Host "The seller-setup flow will handle that." -ForegroundColor Yellow
Write-Host ""
Write-Host "Restart Expo: npx expo start --clear" -ForegroundColor Cyan
