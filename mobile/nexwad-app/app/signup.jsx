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
