import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
  holiday: { icon: "sunny-outline", color: theme.colors.warning, bg: "#FBE5C9" },
  event: { icon: "calendar-outline", color: theme.colors.brandPrimary, bg: theme.colors.brandTertiary },
  activity: { icon: "trophy-outline", color: theme.colors.info, bg: "#E0EEEE" },
  notice: { icon: "alert-circle-outline", color: theme.colors.error, bg: "#FCEFEE" },
};

export default function Announcements() {
  const router = useRouter();
  const { school } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school) return;
    fetch(`${API_BASE}/announcements/${school.id}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [school]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Announcements" subtitle="School updates & activities" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 80 }}>
        {loading ? (
          <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 32 }} />
        ) : (
          items.map((a) => {
            const m = TYPE_META[a.type] || TYPE_META.notice;
            return (
              <View key={a.id} style={styles.card} testID={`announcement-${a.id}`}>
                <View style={[styles.iconWrap, { backgroundColor: m.bg }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.tag, { color: m.color }]}>{a.type.toUpperCase()}</Text>
                    <Text style={styles.date}>{a.date}</Text>
                  </View>
                  <Text style={styles.title}>{a.title}</Text>
                  <Text style={styles.body}>{a.body}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  card: {
    flexDirection: "row", gap: 12,
    backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  tag: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  date: { fontSize: 11, color: theme.colors.onSurfaceTertiary },
  title: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface, marginBottom: 4 },
  body: { fontSize: 13, color: theme.colors.onSurfaceTertiary, lineHeight: 18 },
});
