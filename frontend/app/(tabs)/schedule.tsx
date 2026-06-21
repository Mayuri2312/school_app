import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const insets = useSafeAreaInsets();
  const { student } = useAuth();
  const [tab, setTab] = useState<"classes" | "exams">("classes");
  const [timetable, setTimetable] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const [selectedDay, setSelectedDay] = useState(
    DAYS.includes(todayName) ? todayName : "Monday",
  );

  useEffect(() => {
    if (!student) return;
    Promise.all([
      fetch(`${API_BASE}/timetable/${student.id}`).then((r) => r.json()),
      fetch(`${API_BASE}/exams/${student.id}`).then((r) => r.json()),
    ])
      .then(([tt, ex]) => {
        setTimetable(tt || []);
        setExams(ex || []);
      })
      .finally(() => setLoading(false));
  }, [student]);

  const dayClasses = timetable.filter((t) => t.day === selectedDay);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <View style={styles.segment}>
          {(["classes", "exams"] as const).map((s) => (
            <Pressable
              key={s}
              testID={`segment-${s}`}
              onPress={() => {
                Haptics.selectionAsync?.();
                setTab(s);
              }}
              style={[styles.segItem, tab === s && styles.segItemActive]}
            >
              <Text style={[styles.segText, tab === s && styles.segTextActive]}>
                {s === "classes" ? "Classes" : "Exams"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "classes" && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
            style={{ flexGrow: 0 }}
          >
            {DAYS.map((d) => (
              <Pressable
                key={d}
                testID={`day-${d.toLowerCase()}`}
                style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                onPress={() => {
                  Haptics.selectionAsync?.();
                  setSelectedDay(d);
                }}
              >
                <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                  {d.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 24 }} />
            ) : dayClasses.length === 0 ? (
              <Text style={styles.empty}>No classes scheduled</Text>
            ) : (
              dayClasses.map((c, i) => (
                <View key={c.id} style={styles.classRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.timeText}>{c.start_time}</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeSub}>{c.end_time}</Text>
                  </View>
                  <View
                    style={[
                      styles.classCard,
                      (c.subject === "Break" || c.subject === "Lunch") && styles.classCardMuted,
                    ]}
                  >
                    <Text style={styles.classSubject}>{c.subject}</Text>
                    {c.teacher ? <Text style={styles.classTeacher}>{c.teacher}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

      {tab === "exams" && (
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 24 }} />
          ) : exams.length === 0 ? (
            <Text style={styles.empty}>No exams scheduled</Text>
          ) : (
            <>
              <Text style={styles.examHeading}>{exams[0]?.name}</Text>
              {exams.map((e) => (
                <View key={e.id} style={styles.examCard} testID={`exam-${e.id}`}>
                  <View style={styles.examDate}>
                    <Text style={styles.examDay}>
                      {new Date(e.date).toLocaleDateString("en-US", { day: "2-digit" })}
                    </Text>
                    <Text style={styles.examMonth}>
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short" })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.examSubject}>{e.subject}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={13} color={theme.colors.onSurfaceTertiary} />
                      <Text style={styles.examMeta}>{e.start_time} - {e.end_time}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={theme.colors.onSurfaceTertiary} />
                      <Text style={styles.examMeta}>{e.room}</Text>
                    </View>
                    <Text style={styles.examSyllabus} numberOfLines={2}>{e.syllabus}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
  },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  segment: {
    flexDirection: "row", backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: theme.radius.md, padding: 3,
  },
  segItem: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: theme.radius.sm },
  segItemActive: { backgroundColor: theme.colors.surfaceSecondary },
  segText: { fontSize: 13, color: theme.colors.onSurfaceTertiary, fontWeight: "500" },
  segTextActive: { color: theme.colors.brandPrimary, fontWeight: "600" },
  dayRow: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, gap: 8 },
  dayChip: {
    width: 56, height: 36, borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
    flexShrink: 0,
  },
  dayChipActive: { backgroundColor: theme.colors.brandPrimary, borderColor: theme.colors.brandPrimary },
  dayChipText: { fontSize: 13, color: theme.colors.onSurface, fontWeight: "500" },
  dayChipTextActive: { color: "#fff", fontWeight: "600" },
  classRow: { flexDirection: "row", gap: 12, marginBottom: theme.spacing.md },
  timeCol: { width: 60, alignItems: "center", paddingTop: 8 },
  timeText: { fontSize: 13, fontWeight: "600", color: theme.colors.onSurface },
  timeSub: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginTop: 4 },
  timeLine: { width: 2, height: 22, backgroundColor: theme.colors.border, marginVertical: 4 },
  classCard: {
    flex: 1, padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  classCardMuted: { backgroundColor: theme.colors.surfaceTertiary },
  classSubject: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface },
  classTeacher: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 4 },
  empty: { textAlign: "center", color: theme.colors.onSurfaceTertiary, marginTop: 32 },
  examHeading: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  examCard: {
    flexDirection: "row", gap: 12, padding: theme.spacing.md, marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  examDate: {
    width: 56, height: 56, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brandTertiary,
    alignItems: "center", justifyContent: "center",
  },
  examDay: { fontSize: 20, fontWeight: "700", color: theme.colors.onBrandTertiary },
  examMonth: { fontSize: 11, color: theme.colors.onBrandTertiary, marginTop: -2 },
  examSubject: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  examMeta: { fontSize: 12, color: theme.colors.onSurfaceTertiary },
  examSyllabus: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 6, fontStyle: "italic" },
});
