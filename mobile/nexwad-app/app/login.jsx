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
