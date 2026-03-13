# Wire messages.jsx to real API
# Run from: C:\Users\DARAKU\Desktop\NEX_WAD\nexwad-app

Write-Host "Wiring messages.jsx..." -ForegroundColor Cyan

$file = "app\(tabs)\messages.jsx"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Add API import after Ionicons
$oldImport = 'import { Ionicons } from "@expo/vector-icons";'
$newImport = 'import { Ionicons } from "@expo/vector-icons";
import api from "../../src/api/client";
import { useAuth } from "../../src/api/auth-context";'
$content = $content.Replace($oldImport, $newImport)

# 2. Replace the Feed component state
$oldState = '  const [search, setSearch] = useState("");'
$newState = '  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [convos, setConvos] = useState(CONVOS);
  const [loadingConvos, setLoadingConvos] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingConvos(true);
      try {
        const { conversations } = await api.conversations.list();
        if (conversations && conversations.length > 0) {
          const mapped = conversations.map(c => {
            const other = c.participants?.find(p => p.id !== user?.id) || {};
            const name = other.name || "User";
            const initials = name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
            return {
              id: c.id,
              name,
              initials,
              bg: "#DBEAFE",
              color: "#1E3A8A",
              lastMsg: c.lastMessage?.content || "No messages yet",
              time: c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleDateString() : "",
              unread: c.unreadCount || 0,
              online: false,
            };
          });
          setConvos(mapped);
        }
      } catch (err) {
        console.log("[messages]", err.message);
      } finally {
        setLoadingConvos(false);
      }
    };
    load();
  }, []);'
$content = $content.Replace($oldState, $newState)

# 3. Replace CONVOS references with convos state
$content = $content.Replace(
  'const filtered = CONVOS.filter(c =>',
  'const filtered = convos.filter(c =>'
)
$content = $content.Replace(
  'const totalUnread = CONVOS.reduce((s, c) => s + c.unread, 0);',
  'const totalUnread = convos.reduce((s, c) => s + c.unread, 0);'
)

# Save
$content | Set-Content $file -Encoding UTF8

Write-Host "messages.jsx wired!" -ForegroundColor Green
Write-Host "Restart Expo: npx expo start --clear" -ForegroundColor Cyan
