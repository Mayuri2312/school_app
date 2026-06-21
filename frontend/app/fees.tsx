import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

const STATUS_META: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: theme.colors.brandTertiary, fg: theme.colors.success, label: "Paid" },
  due: { bg: "#FBE5C9", fg: theme.colors.warning, label: "Due" },
  upcoming: { bg: theme.colors.surfaceTertiary, fg: theme.colors.onSurfaceTertiary, label: "Upcoming" },
};

export default function Fees() {
  const router = useRouter();
  const { student } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!student) return;
    const r = await fetch(`${API_BASE}/fees/${student.id}`);
    setData(await r.json());
    setLoading(false);
  }, [student]);

  useEffect(() => { load(); }, [load]);

  async function pay(fee_id: string) {
    setPaying(fee_id);
    try {
      const r = await fetch(`${API_BASE}/fees/pay`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee_id }),
      });
      if (r.ok) {
        if (toast == null) Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
        setToast("Payment successful");
        setTimeout(() => setToast(null), 2000);
        await load();
      }
    } finally {
      setPaying(null);
    }
  }

  const dueItems = data?.items?.filter((i: any) => i.status === "due") || [];

  return (
    <View style={styles.root}>
      <ScreenHeader title="Fees" subtitle="Tuition & payments" onBack={() => router.back()} />
      {loading || !data ? (
        <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 80 }} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: dueItems.length ? 140 : 80 }}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Total payable this year</Text>
              <Text style={styles.summaryTotal}>₹{data.total.toLocaleString()}</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${(data.paid / data.total) * 100}%` }]} />
              </View>
              <View style={styles.miniRow}>
                <View><Text style={[styles.miniVal, { color: theme.colors.success }]}>₹{data.paid.toLocaleString()}</Text><Text style={styles.miniLbl}>Paid</Text></View>
                <View><Text style={[styles.miniVal, { color: theme.colors.warning }]}>₹{data.due.toLocaleString()}</Text><Text style={styles.miniLbl}>Due</Text></View>
                <View><Text style={[styles.miniVal, { color: theme.colors.onSurfaceTertiary }]}>₹{(data.total - data.paid - data.due).toLocaleString()}</Text><Text style={styles.miniLbl}>Upcoming</Text></View>
              </View>
            </View>

            <Text style={styles.section}>All Invoices</Text>
            {data.items.map((it: any) => {
              const m = STATUS_META[it.status] || STATUS_META.upcoming;
              return (
                <View key={it.id} style={styles.feeCard} testID={`fee-${it.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feeTerm}>{it.term}</Text>
                    <Text style={styles.feeSub}>Due {it.due_date}</Text>
                    {it.paid_on && <Text style={styles.feeSub}>Paid on {it.paid_on}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.feeAmount}>₹{it.amount.toLocaleString()}</Text>
                    <View style={[styles.feePill, { backgroundColor: m.bg }]}>
                      <Text style={[styles.feePillText, { color: m.fg }]}>{m.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {dueItems.length > 0 && (
            <View style={styles.stickyBar}>
              <Pressable
                testID="pay-due-button"
                style={styles.payBtn}
                onPress={() => pay(dueItems[0].id)}
                disabled={!!paying}
              >
                {paying ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.payText}>Pay ₹{dueItems[0].amount.toLocaleString()} now</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {toast && (
            <View style={styles.toast} testID="fee-toast">
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  summary: { backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  summaryLabel: { fontSize: 12, color: theme.colors.onSurfaceTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryTotal: { fontSize: 28, fontWeight: "700", color: theme.colors.onSurface, marginTop: 4 },
  progressBg: { height: 8, backgroundColor: theme.colors.surfaceTertiary, borderRadius: 4, marginTop: theme.spacing.md, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: theme.colors.success, borderRadius: 4 },
  miniRow: { flexDirection: "row", justifyContent: "space-between", marginTop: theme.spacing.md },
  miniVal: { fontSize: 15, fontWeight: "700" },
  miniLbl: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  section: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  feeCard: { flexDirection: "row", alignItems: "center", padding: theme.spacing.md, marginBottom: 8, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  feeTerm: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface },
  feeSub: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  feeAmount: { fontSize: 15, fontWeight: "700", color: theme.colors.onSurface },
  feePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  feePillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.brandPrimary, height: 52, borderRadius: theme.radius.md },
  payText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  toast: { position: "absolute", top: 100, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.success, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  toastText: { color: "#fff", fontWeight: "600" },
});
