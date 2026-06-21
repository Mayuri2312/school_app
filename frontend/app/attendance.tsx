import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

const STATUS_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  present: { bg: theme.colors.brandTertiary, fg: theme.colors.success, label: "Present" },
  absent: { bg: "#FCEFEE", fg: theme.colors.error, label: "Absent" },
  leave: { bg: "#FBE5C9", fg: theme.colors.warning, label: "Leave" },
  holiday: { bg: theme.colors.surfaceTertiary, fg: theme.colors.onSurfaceTertiary, label: "Holiday" },
};

export default function Attendance() {
  const router = useRouter();
  const { student } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    fetch(`${API_BASE}/attendance/${student.id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [student]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Attendance" subtitle="Last 30 days" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 80 }}>
        {loading || !data ? (
          <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 32 }} />
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.percent} testID="attendance-percent">{data.percent}%</Text>
              <Text style={styles.percentLabel}>Overall attendance</Text>
              <View style={styles.statRow}>
                <Stat label="Present" value={data.present} color={theme.colors.success} />
                <Stat label="Absent" value={data.absent} color={theme.colors.error} />
                <Stat label="Leave" value={data.leave} color={theme.colors.warning} />
                <Stat label="Total" value={data.total_days} color={theme.colors.onSurface} />
              </View>
            </View>

            <Text style={styles.section}>Daily log</Text>
            {data.records.map((r: any) => {
              const m = STATUS_COLOR[r.status] || STATUS_COLOR.holiday;
              return (
                <View key={r.id} style={styles.row}>
                  <Text style={styles.date}>{r.date}</Text>
                  <View style={[styles.pill, { backgroundColor: m.bg }]}>
                    <Text style={[styles.pillText, { color: m.fg }]}>{m.label}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  summary: { backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.xl, borderRadius: theme.radius.md, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  percent: { fontSize: 44, fontWeight: "700", color: theme.colors.brandPrimary },
  percentLabel: { fontSize: 13, color: theme.colors.onSurfaceTertiary, marginTop: 4 },
  statRow: { flexDirection: "row", marginTop: theme.spacing.lg, width: "100%" },
  statCell: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "700" },
  statLbl: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  section: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.md, borderRadius: theme.radius.sm,
    marginBottom: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  date: { fontSize: 13, color: theme.colors.onSurface, fontWeight: "500" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { fontSize: 11, fontWeight: "600" },
});
