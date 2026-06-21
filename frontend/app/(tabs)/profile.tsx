import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { student, school, signOut, updateStudent } = useAuth();
  const [feeSummary, setFeeSummary] = useState<{ total: number; paid: number; due: number } | null>(null);
  const [att, setAtt] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!student) return;
    fetch(`${API_BASE}/fees/${student.id}`).then((r) => r.json()).then((j) => setFeeSummary(j));
    fetch(`${API_BASE}/attendance/${student.id}`).then((r) => r.json()).then((j) => setAtt(j));
  }, [student]);

  async function changePhoto() {
    if (!student) return;
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const dataUrl =
      asset.base64 && asset.mimeType
        ? `data:${asset.mimeType};base64,${asset.base64}`
        : asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
    setUploading(true);
    try {
      const r = await fetch(`${API_BASE}/student/${student.id}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: dataUrl }),
      });
      if (r.ok) {
        const updated = await r.json();
        await updateStudent({ photo_url: updated.photo_url });
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setUploading(false);
    }
  }

  if (!student || !school) return null;

  const paidPct = feeSummary && feeSummary.total ? Math.round((feeSummary.paid / feeSummary.total) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 140 }}>
        {/* Student info card */}
        <View style={styles.profileHead}>
          <Pressable
            testID="profile-avatar-button"
            onPress={changePhoto}
            style={[styles.avatar, { backgroundColor: student.avatar_color }]}
            disabled={uploading}
          >
            {student.photo_url ? (
              <Image source={student.photo_url} style={styles.avatarImg} contentFit="cover" testID="profile-avatar-img" />
            ) : (
              <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} testID="profile-name">{student.name}</Text>
            <Text style={styles.subtle}>{school.name}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{student.class}-{student.section}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Roll No</Text>
            <Text style={styles.infoValue}>{student.roll_number}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Admission</Text>
            <Text style={styles.infoValue}>{student.admission_no}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>DOB</Text>
            <Text style={styles.infoValue}>{student.dob}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Parent</Text>
            <Text style={styles.infoValue}>{student.parent_name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{student.parent_phone}</Text>
          </View>
        </View>

        {/* Attendance summary */}
        {att && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Attendance Overview</Text>
              <Pressable onPress={() => router.push("/attendance")} testID="profile-attendance-link">
                <Text style={styles.link}>Details</Text>
              </Pressable>
            </View>
            <Text style={styles.percentBig}>{att.percent}%</Text>
            <View style={styles.attRow}>
              <View style={styles.attCell}><Text style={styles.attNum}>{att.present}</Text><Text style={styles.attLbl}>Present</Text></View>
              <View style={styles.attCell}><Text style={[styles.attNum, { color: theme.colors.error }]}>{att.absent}</Text><Text style={styles.attLbl}>Absent</Text></View>
              <View style={styles.attCell}><Text style={[styles.attNum, { color: theme.colors.warning }]}>{att.leave}</Text><Text style={styles.attLbl}>Leave</Text></View>
            </View>
          </View>
        )}

        {/* Fees summary */}
        {feeSummary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Fee Tracker</Text>
              <Pressable onPress={() => router.push("/fees")} testID="profile-fees-link">
                <Text style={styles.link}>Details</Text>
              </Pressable>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${paidPct}%` }]} />
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feePaid}>₹{feeSummary.paid.toLocaleString()} paid</Text>
              <Text style={styles.feeDue}>₹{feeSummary.due.toLocaleString()} due</Text>
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menu}>
          <MenuItem icon="book-outline" label="Homework" onPress={() => router.push("/homework")} testID="menu-homework" />
          <MenuItem icon="megaphone-outline" label="Announcements" onPress={() => router.push("/announcements")} testID="menu-announcements" />
          <MenuItem icon="calendar-clear-outline" label="Leave Requests" onPress={() => router.push("/leave-request")} testID="menu-leaves" />
          <MenuItem icon="sparkles-outline" label="AI Homework Helper" onPress={() => router.push("/ai-helper")} testID="menu-ai" />
        </View>

        <Pressable
          testID="profile-signout-button"
          style={styles.signoutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
          <Text style={styles.signoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={18} color={theme.colors.brandPrimary} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  profileHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: theme.spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "600" },
  cameraBadge: {
    position: "absolute", right: 0, bottom: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: theme.colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: theme.colors.surface,
  },
  name: { fontSize: 20, fontWeight: "700", color: theme.colors.onSurface },
  subtle: { fontSize: 13, color: theme.colors.onSurfaceTertiary },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  infoCell: {
    width: "50%", padding: 4,
  },
  infoLabel: { fontSize: 11, color: theme.colors.onSurfaceTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "500", color: theme.colors.onSurface, paddingVertical: 6 },
  summaryCard: {
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, marginTop: theme.spacing.lg,
  },
  summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTitle: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface },
  link: { color: theme.colors.brandPrimary, fontSize: 13, fontWeight: "500" },
  percentBig: { fontSize: 32, fontWeight: "700", color: theme.colors.brandPrimary, marginTop: 8 },
  attRow: { flexDirection: "row", marginTop: theme.spacing.md },
  attCell: { flex: 1, alignItems: "center" },
  attNum: { fontSize: 20, fontWeight: "700", color: theme.colors.success },
  attLbl: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  progressBg: { height: 8, backgroundColor: theme.colors.surfaceTertiary, borderRadius: 4, marginTop: theme.spacing.md, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: theme.colors.success, borderRadius: 4 },
  feeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing.md },
  feePaid: { fontSize: 13, color: theme.colors.success, fontWeight: "600" },
  feeDue: { fontSize: 13, color: theme.colors.warning, fontWeight: "600" },
  menu: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  menuLabel: { flex: 1, fontSize: 14, color: theme.colors.onSurface, fontWeight: "500" },
  signoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: theme.spacing.xl, paddingVertical: 14, borderRadius: theme.radius.md, backgroundColor: "#FCEFEE" },
  signoutText: { color: theme.colors.error, fontWeight: "600" },
});
