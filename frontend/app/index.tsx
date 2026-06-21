import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";
import { registerForPush } from "@/src/push";

const HERO_IMG = "https://images.unsplash.com/photo-1778751225720-ee0f1d2ad14e?crop=entropy&cs=srgb&fm=jpg&w=1080&q=80";

export default function Login() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [school, setSchool] = useState("Greenwood International");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogin() {
    Keyboard.dismiss();
    setErr(null);
    if (!school.trim() || !studentName.trim() || !password.trim()) {
      setErr("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: school.trim(),
          student_name: studentName.trim(),
          password: password.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.detail || "Login failed");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setSession(j.student, j.school);
      registerForPush(j.student.id).catch(() => {});
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={HERO_IMG} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient
            colors={["rgba(43,45,43,0.0)", "rgba(43,45,43,0.85)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView style={styles.heroContent} edges={["top"]}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Ionicons name="school" size={22} color={theme.colors.brandPrimary} />
              </View>
              <Text style={styles.logoText}>EduTrack Parent</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.heroTitle}>Stay connected with your child's school day</Text>
            <Text style={styles.heroSub}>Homework, fees, attendance & more in one place</Text>
          </SafeAreaView>
        </View>

        <View style={styles.card} testID="login-card">
          <Text style={styles.formTitle}>Parent Login</Text>
          <Text style={styles.formSub}>Sign in to track your child's school activities</Text>

          <Text style={styles.label}>School Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={18} color={theme.colors.onSurfaceTertiary} />
            <TextInput
              testID="login-school-input"
              style={styles.input}
              value={school}
              onChangeText={setSchool}
              placeholder="e.g. Greenwood International"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Student Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={theme.colors.onSurfaceTertiary} />
            <TextInput
              testID="login-student-input"
              style={styles.input}
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Full name as in records"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.onSurfaceTertiary} />
            <TextInput
              testID="login-password-input"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Provided by school"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              secureTextEntry
            />
          </View>

          {err ? <Text style={styles.err} testID="login-error">{err}</Text> : null}

          <Pressable
            testID="login-submit-button"
            style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable testID="login-demo-toggle" onPress={() => setShowHint((v) => !v)} style={styles.hintBtn}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.brandPrimary} />
            <Text style={styles.hintText}>{showHint ? "Hide demo accounts" : "Show demo accounts"}</Text>
          </Pressable>
          {showHint && (
            <View style={styles.hintCard}>
              <Text style={styles.hintHead}>Demo accounts</Text>
              <Text style={styles.hintLine}>School: Greenwood International</Text>
              <Text style={styles.hintLine}>Aarav Sharma  ·  aarav123</Text>
              <Text style={styles.hintLine}>Priya Patel  ·  priya123</Text>
              <Text style={styles.hintLine}>Rohan Mehta  ·  rohan123</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  scroll: { flexGrow: 1, backgroundColor: theme.colors.surface },
  hero: { height: 340, justifyContent: "flex-end", overflow: "hidden" },
  heroContent: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FFFFFFEE",
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  heroTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "700", lineHeight: 32, marginBottom: 6 },
  heroSub: { color: "#FFFFFFCC", fontSize: 14 },
  card: {
    backgroundColor: theme.colors.surfaceSecondary,
    marginHorizontal: theme.spacing.lg,
    marginTop: -28,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    marginBottom: theme.spacing.xl,
  },
  formTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.onSurface, marginBottom: 4 },
  formSub: { fontSize: 13, color: theme.colors.onSurfaceTertiary, marginBottom: theme.spacing.lg },
  label: { fontSize: 13, fontWeight: "500", color: theme.colors.onSurfaceTertiary, marginTop: theme.spacing.md, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: theme.radius.md, paddingHorizontal: 12, height: 48,
  },
  input: { flex: 1, fontSize: 15, color: theme.colors.onSurface, paddingVertical: 8 },
  submit: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.brandPrimary,
    height: 52, borderRadius: theme.radius.md,
    alignItems: "center", justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  err: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 13 },
  hintBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: theme.spacing.md, alignSelf: "center" },
  hintText: { color: theme.colors.brandPrimary, fontSize: 13, fontWeight: "500" },
  hintCard: {
    marginTop: theme.spacing.md, backgroundColor: theme.colors.brandTertiary,
    borderRadius: theme.radius.md, padding: theme.spacing.md,
  },
  hintHead: { fontWeight: "600", color: theme.colors.onBrandTertiary, marginBottom: 6 },
  hintLine: { color: theme.colors.onBrandTertiary, fontSize: 13, marginBottom: 3 },
});
