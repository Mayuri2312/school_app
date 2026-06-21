import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: "calculator-outline",
  Science: "flask-outline",
  English: "book-outline",
  Hindi: "language-outline",
  "Social Studies": "earth-outline",
  Computer: "laptop-outline",
};

export default function Homework() {
  const router = useRouter();
  const { student } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    fetch(`${API_BASE}/homework/${student.id}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [student]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Homework" subtitle="Daily assignments" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 32 }} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No homework assigned</Text>
        ) : (
          items.map((hw) => {
            const overdue = new Date(hw.due_date) < new Date(new Date().toDateString());
            return (
              <View key={hw.id} style={styles.card} testID={`homework-${hw.id}`}>
                <View style={styles.cardHead}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={(SUBJECT_ICONS[hw.subject] as any) || "book-outline"}
                      size={20}
                      color={theme.colors.onBrandTertiary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{hw.subject}</Text>
                    <Text style={styles.teacher}>{hw.teacher}</Text>
                  </View>
                  <View style={[styles.dueTag, overdue && styles.dueTagLate]}>
                    <Text style={[styles.dueText, overdue && { color: "#fff" }]}>
                      Due {hw.due_date}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title}>{hw.title}</Text>
                <Text style={styles.body}>{hw.description}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.stickyBar}>
        <Pressable
          testID="open-ai-helper-button"
          style={styles.stickyBtn}
          onPress={() => router.push("/ai-helper")}
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.stickyText}>Need help? Ask AI Homework Helper</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  card: {
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.lg,
    marginBottom: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: theme.spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  subject: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface },
  teacher: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  dueTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.colors.surfaceTertiary },
  dueTagLate: { backgroundColor: theme.colors.error },
  dueText: { fontSize: 11, color: theme.colors.onSurfaceTertiary, fontWeight: "500" },
  title: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface, marginBottom: 4 },
  body: { fontSize: 13, color: theme.colors.onSurfaceTertiary, lineHeight: 18 },
  empty: { textAlign: "center", color: theme.colors.onSurfaceTertiary, marginTop: 32 },
  stickyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
  },
  stickyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: theme.colors.brandPrimary, height: 52, borderRadius: theme.radius.md,
  },
  stickyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
