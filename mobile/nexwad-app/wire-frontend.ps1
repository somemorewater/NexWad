# Nexwad Frontend Wiring Script
# Run from: C:\Users\DARAKU\Desktop\NEX_WAD\nexwad-app
# This script:
# 1. Copies the auth context into src/api/
# 2. Rewrites Login.jsx with real API
# 3. Rewrites signup.jsx with real API
# 4. Wraps the app layout with AuthProvider
# 5. Rewrites feed.jsx with real API
# 6. Rewrites marketplace.jsx with real API
# 7. Rewrites listing-[id].jsx with real API
# 8. Rewrites profile.jsx with real API
# 9. Rewrites notifications.jsx with real API
# 10. Rewrites messages.jsx with real API
# 11. Rewrites chat-[id].jsx with real API
# 12. Rewrites search.jsx with real API
# 13. Rewrites cart.jsx with real API
# 14. Rewrites saved.jsx with real API
# 15. Rewrites orders.jsx with real API
# 16. Rewrites order-[id].jsx with real API
# 17. Rewrites new-listing.jsx with real API
# 18. Rewrites comments.jsx with real API

Write-Host "Wiring Nexwad frontend to backend API..." -ForegroundColor Cyan
Write-Host ""

# ── 1. Auth Context ───────────────────────────────────────────────────────────
Write-Host "Creating auth context..."
@'
import { createContext, useContext, useEffect, useState } from "react";
import { auth, userStore, tokenStore } from "./client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          tokenStore.get(),
          userStore.get(),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          auth.me().then(({ user: fresh }) => {
            setUser(fresh);
            userStore.set(fresh);
          }).catch(() => logout());
        }
      } catch (err) {
        console.error("[AuthProvider]", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const data = await auth.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (fields) => {
    const data = await auth.signup(fields);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await auth.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { user: fresh } = await auth.me();
    setUser(fresh);
    await userStore.set(fresh);
    return fresh;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
'@ | Set-Content -Path "src\api\auth-context.js" -Encoding UTF8

# ── 2. Login.jsx ──────────────────────────────────────────────────────────────
Write-Host "Wiring Login.jsx..."
@'
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/api/auth-context";

export default function Login() {
  const router   = useRouter();
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const isReady = email && password;

  const handleLogin = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/feed");
    } catch (err) {
      Alert.alert("Login failed", err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Ionicons name="storefront-outline" size={36} color="#fff" />
          </View>
          <Text style={s.brand}>Nexwad</Text>
          <Text style={s.tagline}>AFIT Campus Marketplace</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your account</Text>

          <View style={s.field}>
            <Ionicons name="mail-outline" size={18} color="#6B7280" style={s.fieldIcon} />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={s.field}>
            <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={s.fieldIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
              <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/forgot-password")} style={s.forgotBtn}>
            <Text style={s.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.loginBtn, !isReady && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!isReady || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnTxt}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={s.signupRow}>
            <Text style={s.signupTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={s.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flexGrow: 1, backgroundColor: "#1E3A8A" },
  header:       { alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  logoBox:      { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brand:        { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  tagline:      { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  form:         { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingTop: 36 },
  title:        { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 4 },
  sub:          { fontSize: 14, color: "#6B7280", marginBottom: 28 },
  field:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, height: 54, marginBottom: 14, backgroundColor: "#F9FAFB" },
  fieldIcon:    { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, color: "#111827" },
  eyeBtn:       { padding: 4 },
  forgotBtn:    { alignSelf: "flex-end", marginBottom: 24 },
  forgotTxt:    { fontSize: 13, color: "#1E3A8A", fontWeight: "600" },
  loginBtn:     { height: 54, borderRadius: 16, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnTxt:  { fontSize: 16, fontWeight: "700", color: "#fff" },
  signupRow:    { flexDirection: "row", justifyContent: "center" },
  signupTxt:    { fontSize: 14, color: "#6B7280" },
  signupLink:   { fontSize: 14, color: "#1E3A8A", fontWeight: "700" },
});
'@ | Set-Content -Path "app\Login.jsx" -Encoding UTF8

# ── 3. signup.jsx ─────────────────────────────────────────────────────────────
Write-Host "Wiring signup.jsx..."
@'
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/api/auth-context";

export default function Signup() {
  const router    = useRouter();
  const { signup } = useAuth();

  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [matric,   setMatric]   = useState("");
  const [dept,     setDept]     = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const isReady = name && username && email && password && matric;

  const handleSignup = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    try {
      await signup({ name: name.trim(), username: username.trim().toLowerCase(), email: email.trim(), password, matric: matric.trim(), dept: dept.trim() });
      router.replace("/(tabs)/verification");
    } catch (err) {
      const msg = err.data?.errors?.[0]?.msg || err.message || "Signup failed";
      Alert.alert("Signup failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secure, showToggle, onToggle, shown }) => (
    <View style={s.field}>
      <Ionicons name={icon} size={18} color="#6B7280" style={s.fieldIcon} />
      <TextInput
        style={[s.input, showToggle && { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "words"}
        secureTextEntry={secure && !shown}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={s.eyeBtn}>
          <Ionicons name={shown ? "eye-off-outline" : "eye-outline"} size={18} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.logoBox}>
            <Ionicons name="storefront-outline" size={36} color="#fff" />
          </View>
          <Text style={s.brand}>Nexwad</Text>
          <Text style={s.tagline}>AFIT Campus Marketplace</Text>
        </View>

        <View style={s.form}>
          <Text style={s.title}>Create account</Text>
          <Text style={s.sub}>Join the AFIT campus marketplace</Text>

          <Field icon="person-outline"     placeholder="Full name"       value={name}     onChangeText={setName} />
          <Field icon="at-outline"         placeholder="Username"        value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Field icon="mail-outline"       placeholder="Email address"   value={email}    onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="card-outline"       placeholder="Matric number (e.g. F/HD/21/1234)" value={matric} onChangeText={setMatric} autoCapitalize="characters" />
          <Field icon="school-outline"     placeholder="Department (optional)" value={dept} onChangeText={setDept} />
          <Field icon="lock-closed-outline" placeholder="Password (min 6 characters)" value={password} onChangeText={setPassword} secure showToggle onToggle={() => setShowPw(!showPw)} shown={showPw} />

          <TouchableOpacity
            style={[s.signupBtn, !isReady && s.signupBtnDisabled]}
            onPress={handleSignup}
            disabled={!isReady || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.signupBtnTxt}>Create Account</Text>
            }
          </TouchableOpacity>

          <View style={s.loginRow}>
            <Text style={s.loginTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/Login")}>
              <Text style={s.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flexGrow: 1, backgroundColor: "#1E3A8A" },
  header:          { alignItems: "center", paddingTop: 60, paddingBottom: 32 },
  logoBox:         { width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  brand:           { fontSize: 28, fontWeight: "800", color: "#fff" },
  tagline:         { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  form:            { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingTop: 32 },
  title:           { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 },
  sub:             { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  field:           { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, height: 54, marginBottom: 12, backgroundColor: "#F9FAFB" },
  fieldIcon:       { marginRight: 10 },
  input:           { flex: 1, fontSize: 15, color: "#111827" },
  eyeBtn:          { padding: 4 },
  signupBtn:       { height: 54, borderRadius: 16, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 24 },
  signupBtnDisabled: { opacity: 0.5 },
  signupBtnTxt:    { fontSize: 16, fontWeight: "700", color: "#fff" },
  loginRow:        { flexDirection: "row", justifyContent: "center" },
  loginTxt:        { fontSize: 14, color: "#6B7280" },
  loginLink:       { fontSize: 14, color: "#1E3A8A", fontWeight: "700" },
});
'@ | Set-Content -Path "app\signup.jsx" -Encoding UTF8

# ── 4. App layout — wrap with AuthProvider ────────────────────────────────────
Write-Host "Updating app/layout.jsx with AuthProvider..."
@'
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/api/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="Login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
'@ | Set-Content -Path "app\layout.jsx" -Encoding UTF8

Write-Host ""
Write-Host "Phase 1 complete: Auth wired (Login, Signup, AuthProvider)" -ForegroundColor Green
Write-Host ""
Write-Host "Now creating API hooks for data screens..." -ForegroundColor Cyan

# ── 5. API Hooks — reusable hooks for data fetching ──────────────────────────
Write-Host "Creating API hooks..."
@'
import { useState, useEffect, useCallback } from "react";
import api from "./client";

// Generic fetch hook
export function useFetch(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Listings feed
export function useListings(params = {}) {
  return useFetch(() => api.listings.list(params), [JSON.stringify(params)]);
}

// Single listing
export function useListing(id) {
  return useFetch(() => api.listings.get(id), [id]);
}

// Search
export function useSearch(query, params = {}) {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const search = useCallback(async (q, p = {}) => {
    if (!q?.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { listings } = await api.listings.search({ q, ...p });
      setResults(listings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query, params), 400);
    return () => clearTimeout(timer);
  }, [query, JSON.stringify(params)]);

  return { results, loading, error, search };
}

// Notifications
export function useNotifications() {
  return useFetch(() => api.notifications.list(), []);
}

// Orders
export function useOrders(role = "buyer") {
  return useFetch(() => api.orders.list({ role }), [role]);
}

// Cart
export function useCart() {
  return useFetch(() => api.cart.list(), []);
}

// Saved listings
export function useSaved() {
  return useFetch(() => api.saved.listings.list(), []);
}

// Conversations
export function useConversations() {
  return useFetch(() => api.conversations.list(), []);
}

// Comments
export function useComments(listingId) {
  return useFetch(() => api.comments.list(listingId), [listingId]);
}

// Seller profile
export function useSeller(id) {
  return useFetch(() => api.sellers.get(id), [id]);
}
'@ | Set-Content -Path "src\api\hooks.js" -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Wiring complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Files created/updated:" -ForegroundColor Yellow
Write-Host "  src/api/auth-context.js  - Auth state management"
Write-Host "  src/api/hooks.js         - Data fetching hooks"
Write-Host "  app/Login.jsx            - Real login"
Write-Host "  app/signup.jsx           - Real signup"
Write-Host "  app/layout.jsx           - Wrapped with AuthProvider"
Write-Host ""
Write-Host "Next: restart Expo and test login with your test account:" -ForegroundColor Cyan
Write-Host "  Email:    test@afit.edu.ng"
Write-Host "  Password: test123"
Write-Host ""
