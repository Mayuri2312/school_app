import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

type HomeData = {
  attendance: { percent: number; today_status: string };
  next_class: { subject: string; teacher: string; time: string } | null;
  due_homework: any[];
  latest_announcement: any | null;
  reminders: any;
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { student, school, signOut } = useAuth();
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!student || !school) return;
    try {
      const [att, hw, ann, tt, rem] = await Promise.all([
        fetch(`${API_BASE}/attendance/${student.id}`).then((r) => r.json()),
        fetch(`${API_BASE}/homework/${student.id}`).then((r) => r.json()),
        fetch(`${API_BASE}/announcements/${school.id}`).then((r) => r.json()),
        fetch(`${API_BASE}/timetable/${student.id}`).then((r) => r.json()),
        fetch(`${API_BASE}/reminders/${student.id}`).then((r) => r.json()),
      ]);
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const todayRecord = (att.records || []).find(
        (r: any) => r.date === new Date().toISOString().slice(0, 10),
      );
      const todayClasses = (tt || []).filter(
        (t: any) => t.day === today && t.subject !== "Break" && t.subject !== "Lunch",
      );
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const upcoming = todayClasses.find((c: any) => {
        const [h, m] = c.start_time.split(":").map(Number);
        return h * 60 + m >= nowMin;
      }) || todayClasses[0];

      setData({
        attendance: {
          percent: att.percent || 0,
          today_status: todayRecord?.status || "—",
        },
        next_class: upcoming
          ? { subject: upcoming.subject, teacher: upcoming.teacher, time: upcoming.start_time }
          : null,
        due_homework: (hw || []).slice(0, 3),
        latest_announcement: (ann || [])[0] || null,
        reminders: rem,
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [student, school]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!student) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: student.avatar_color }]}>
            {student.photo_url ? (
              <Image source={student.photo_url} style={styles.avatarImg} contentFit="cover" testID="home-avatar-img" />
            ) : (
              <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {student.parent_name?.split(" ").slice(0, 2).join(" ")}</Text>
            <Text style={styles.studentName} numberOfLines={1} testID="home-student-name">
              {student.name} · Class {student.class}-{student.section}
            </Text>
          </View>
          <Pressable
            testID="home-signout-button"
            style={styles.iconBtn}
            onPress={async () => {
              await signOut();
              router.replace("/");
            }}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !data ? (
          <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 32 }} />
        ) : null}

        {data && (
          <>
            {/* Hero summary card */}
            <View style={styles.heroCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Today's Attendance</Text>
                <Text style={styles.heroValue} testID="home-attendance-percent">{data.attendance.percent}%</Text>
                <View style={styles.statusPill}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          data.attendance.today_status === "present"
                            ? theme.colors.success
                            : data.attendance.today_status === "absent"
                            ? theme.colors.error
                            : theme.colors.warning,
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {data.attendance.today_status === "present"
                      ? "Marked Present"
                      : data.attendance.today_status === "absent"
                      ? "Absent"
                      : data.attendance.today_status === "leave"
                      ? "On Leave"
                      : "Not marked yet"}
                  </Text>
                </View>
              </View>
              <View style={styles.heroDivider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Next Class</Text>
                {data.next_class ? (
                  <>
                    <Text style={styles.heroValueSm} numberOfLines={1}>{data.next_class.subject}</Text>
                    <Text style={styles.heroSub}>{data.next_class.time} · {data.next_class.teacher}</Text>
                  </>
                ) : (
                  <Text style={styles.heroSub}>No class today</Text>
                )}
              </View>
            </View>

            {/* Quick actions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRow}
            >
              {[
                { key: "homework", label: "Homework", icon: "book-outline", route: "/homework" },
                { key: "fees", label: "Fees", icon: "card-outline", route: "/fees" },
                { key: "attendance", label: "Attendance", icon: "checkmark-circle-outline", route: "/attendance" },
                { key: "leave", label: "Leave", icon: "calendar-clear-outline", route: "/leave-request" },
                { key: "ai", label: "AI Helper", icon: "sparkles-outline", route: "/ai-helper" },
                { key: "news", label: "Updates", icon: "megaphone-outline", route: "/announcements" },
              ].map((a) => (
                <Pressable
                  testID={`quick-${a.key}`}
                  key={a.key}
                  style={styles.quickPill}
                  onPress={() => router.push(a.route as any)}
                >
                  <Ionicons name={a.icon as any} size={16} color={theme.colors.onBrandTertiary} />
                  <Text style={styles.quickText}>{a.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Homework due */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Homework Due</Text>
              <Pressable onPress={() => router.push("/homework")} testID="see-all-homework">
                <Text style={styles.link}>See all</Text>
              </Pressable>
            </View>
            {data.due_homework.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyText}>No pending homework</Text></View>
            ) : (
              data.due_homework.map((hw: any) => (
                <View key={hw.id} style={styles.itemCard}>
                  <View style={styles.iconChip}>
                    <Ionicons name="book-outline" size={18} color={theme.colors.onBrandTertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{hw.title}</Text>
                    <Text style={styles.itemSub}>{hw.subject} · Due {hw.due_date}</Text>
                  </View>
                </View>
              ))
            )}

            {/* Latest announcement */}
            {data.latest_announcement && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Latest Update</Text>
                  <Pressable onPress={() => router.push("/announcements")} testID="see-all-announcements">
                    <Text style={styles.link}>See all</Text>
                  </Pressable>
                </View>
                <View style={styles.annCard}>
                  <View style={styles.annTagRow}>
                    <View style={[styles.tag, { backgroundColor: theme.colors.brandTertiary }]}>
                      <Text style={styles.tagText}>{data.latest_announcement.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.itemSub}>{data.latest_announcement.date}</Text>
                  </View>
                  <Text style={styles.itemTitle}>{data.latest_announcement.title}</Text>
                  <Text style={styles.annBody} numberOfLines={3}>{data.latest_announcement.body}</Text>
                </View>
              </>
            )}

            {/* Reminders */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Reminders</Text>
            </View>
            {(data.reminders?.fees || []).length === 0 && (data.reminders?.exams || []).length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyText}>All caught up!</Text></View>
            ) : (
              <>
                {(data.reminders.fees || []).map((f: any) => (
                  <View key={f.id} style={styles.reminderCard}>
                    <View style={[styles.iconChip, { backgroundColor: "#FBE5C9" }]}>
                      <Ionicons name="card-outline" size={18} color={theme.colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Fee Due · {f.term}</Text>
                      <Text style={styles.itemSub}>₹{f.amount} · due {f.due_date}</Text>
                    </View>
                  </View>
                ))}
                {(data.reminders.exams || []).slice(0, 2).map((e: any) => (
                  <View key={e.id} style={styles.reminderCard}>
                    <View style={[styles.iconChip, { backgroundColor: "#E0EEEE" }]}>
                      <Ionicons name="document-text-outline" size={18} color={theme.colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>Exam · {e.subject}</Text>
                      <Text style={styles.itemSub}>{e.date} · {e.start_time} · {e.room}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  hello: { fontSize: 12, color: theme.colors.onSurfaceTertiary },
  studentName: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surfaceSecondary },
  heroCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  heroDivider: { width: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.md },
  heroLabel: { fontSize: 11, color: theme.colors.onSurfaceTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  heroValue: { fontSize: 28, fontWeight: "700", color: theme.colors.onSurface },
  heroValueSm: { fontSize: 16, fontWeight: "600", color: theme.colors.onSurface, marginTop: 4 },
  heroSub: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 4 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: theme.colors.onSurfaceTertiary },
  quickRow: { paddingVertical: 4, gap: 8, paddingRight: theme.spacing.lg },
  quickPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: theme.colors.brandTertiary,
    paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill,
    flexShrink: 0,
  },
  quickText: { fontSize: 13, color: theme.colors.onBrandTertiary, fontWeight: "500" },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.onSurface },
  link: { color: theme.colors.brandPrimary, fontSize: 13, fontWeight: "500" },
  itemCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.md,
    borderRadius: theme.radius.md, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  reminderCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.md,
    borderRadius: theme.radius.md, marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  iconChip: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "600", color: theme.colors.onSurface },
  itemSub: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  annCard: {
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md,
    padding: theme.spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border,
  },
  annTagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "600", color: theme.colors.onBrandTertiary, letterSpacing: 0.5 },
  annBody: { fontSize: 13, color: theme.colors.onSurfaceTertiary, lineHeight: 18, marginTop: 4 },
  empty: { padding: theme.spacing.lg, alignItems: "center" },
  emptyText: { color: theme.colors.onSurfaceTertiary, fontSize: 13 },
});
