import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

export default function LeaveRequest() {
  const router = useRouter();
  const { student } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    if (!student) return;
    const r = await fetch(`${API_BASE}/leaves/${student.id}`);
    setLeaves(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [student?.id]);

  async function submit() {
    if (!student) return;
    Keyboard.dismiss();
    if (!fromDate || !toDate || !reason.trim()) {
      setToast("Please fill all fields");
      setTimeout(() => setToast(null), 1800);
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/leaves`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id, from_date: fromDate, to_date: toDate, reason,
        }),
      });
      if (r.ok) {
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        setToast("Leave request sent");
        setFromDate(""); setToDate(""); setReason("");
        await load();
        setTimeout(() => setToast(null), 1800);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <ScreenHeader title="Leave Request" subtitle="Apply for student leave" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.label}>From Date</Text>
            <TextInput
              testID="leave-from-input"
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              style={styles.input}
            />
            <Text style={styles.label}>To Date</Text>
            <TextInput
              testID="leave-to-input"
              value={toDate}
              onChangeText={setToDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              style={styles.input}
            />
            <Text style={styles.label}>Reason</Text>
            <TextInput
              testID="leave-reason-input"
              value={reason}
              onChangeText={setReason}
              placeholder="Brief reason for leave"
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              multiline
              style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
            />
            <Pressable
              testID="leave-submit-button"
              style={styles.submit}
              onPress={submit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
            </Pressable>
          </View>

          <Text style={styles.section}>Previous Requests</Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.brandPrimary} />
          ) : leaves.length === 0 ? (
            <Text style={styles.empty}>No previous leave requests</Text>
          ) : (
            leaves.map((l) => (
              <View key={l.id} style={styles.leaveCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaveDates}>{l.from_date} → {l.to_date}</Text>
                  <Text style={styles.leaveReason}>{l.reason}</Text>
                  <Text style={styles.leaveApplied}>Applied: {l.applied_on}</Text>
                </View>
                <View style={[
                  styles.statusPill,
                  l.status === "approved" && { backgroundColor: theme.colors.brandTertiary },
                  l.status === "pending" && { backgroundColor: "#FBE5C9" },
                  l.status === "rejected" && { backgroundColor: "#FCEFEE" },
                ]}>
                  <Text style={[
                    styles.statusText,
                    l.status === "approved" && { color: theme.colors.success },
                    l.status === "pending" && { color: theme.colors.warning },
                    l.status === "rejected" && { color: theme.colors.error },
                  ]}>{l.status.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  form: { backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  label: { fontSize: 12, fontWeight: "500", color: theme.colors.onSurfaceTertiary, marginTop: theme.spacing.md, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, paddingHorizontal: 12, height: 46, fontSize: 14, color: theme.colors.onSurface },
  submit: { marginTop: theme.spacing.xl, backgroundColor: theme.colors.brandPrimary, height: 50, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  section: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  empty: { color: theme.colors.onSurfaceTertiary, textAlign: "center", marginTop: theme.spacing.md },
  leaveCard: { flexDirection: "row", padding: theme.spacing.md, marginBottom: 8, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  leaveDates: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface },
  leaveReason: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  leaveApplied: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  toast: { position: "absolute", top: 100, alignSelf: "center", backgroundColor: theme.colors.onSurface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  toastText: { color: "#fff", fontWeight: "600" },
});
