import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

export default function Bus() {
  const insets = useSafeAreaInsets();
  const { student } = useAuth();
  const [bus, setBus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dotPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    async function fetchBus() {
      try {
        const r = await fetch(`${API_BASE}/bus/${student!.id}`);
        const j = await r.json();
        if (!cancelled) setBus(j);
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBus();
    const id = setInterval(fetchBus, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [student]);

  useEffect(() => {
    if (!bus) return;
    // Position based on lat/lng modulo - just to show movement
    const x = ((bus.live_lng % 1) * 240) - 120;
    const y = ((bus.live_lat % 1) * 200) - 100;
    Animated.timing(dotPos, {
      toValue: { x, y },
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [bus?.live_lat, bus?.live_lng]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  function callDriver() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (bus?.driver_phone) {
      const tel = bus.driver_phone.replace(/\s/g, "");
      Linking.openURL(`tel:${tel}`);
    }
  }

  if (loading && !bus) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      {/* Map area (simulated) */}
      <View style={[styles.mapArea, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["#D6E4D7", "#E7EFE8"]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Roads (decorative) */}
        <View style={[styles.road, { top: "30%", left: -40, right: -40, transform: [{ rotate: "-12deg" }] }]} />
        <View style={[styles.road, { top: "60%", left: -40, right: -40, transform: [{ rotate: "8deg" }] }]} />
        <View style={[styles.roadV, { left: "40%", top: 0, bottom: 0 }]} />
        <View style={[styles.roadV, { left: "75%", top: 0, bottom: 0 }]} />

        {/* Title overlay */}
        <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.mapTitle}>Bus Tracker</Text>
              <Text style={styles.mapSub}>{bus?.route_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Live</Text>
            </View>
          </View>
        </View>

        {/* School marker (center) */}
        <View style={styles.schoolMarker}>
          <Ionicons name="school" size={18} color="#fff" />
        </View>

        {/* Bus marker (animated) */}
        <Animated.View
          style={[
            styles.busMarkerWrap,
            {
              transform: [{ translateX: dotPos.x }, { translateY: dotPos.y }],
            },
          ]}
        >
          <Animated.View style={[styles.pulse, { transform: [{ scale: pulse }] }]} />
          <View style={styles.busMarker}>
            <Ionicons name="bus" size={18} color="#fff" />
          </View>
          <View style={styles.busLabel}>
            <Text style={styles.busLabelText}>{bus?.bus_number}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Info sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.etaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etaLabel}>Arriving in</Text>
              <Text style={styles.etaValue} testID="bus-eta">{bus?.eta_minutes} min</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.etaLabel}>Pickup</Text>
              <Text style={styles.etaValueSm}>{bus?.pickup_time}</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.etaLabel}>Drop</Text>
              <Text style={styles.etaValueSm}>{bus?.drop_time}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Pickup Point</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={theme.colors.brandPrimary} />
            <Text style={styles.rowText}>{bus?.pickup_point}</Text>
          </View>

          <Text style={styles.sectionLabel}>Driver</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>{bus?.driver_name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{bus?.driver_name}</Text>
              <Text style={styles.driverPhone}>{bus?.driver_phone}</Text>
            </View>
            <Pressable
              testID="call-driver-button"
              style={styles.callBtn}
              onPress={callDriver}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Route Stops</Text>
          {(bus?.stops || []).map((s: any, i: number) => (
            <View key={`${s.name}-${i}`} style={styles.stopRow}>
              <View style={styles.stopDotCol}>
                <View style={[styles.stopDot, i === 0 && styles.stopDotActive]} />
                {i < (bus?.stops?.length || 0) - 1 && <View style={styles.stopLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopName}>{s.name}</Text>
                <Text style={styles.stopTime}>{s.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  mapArea: { height: "45%", overflow: "hidden" },
  road: { position: "absolute", height: 18, backgroundColor: "#FFFFFFAA", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#FFFFFF66" },
  roadV: { position: "absolute", width: 14, backgroundColor: "#FFFFFFAA" },
  mapHeader: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
  mapHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mapTitle: { fontSize: 22, fontWeight: "700", color: theme.colors.onSurface },
  mapSub: { fontSize: 13, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14 },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  schoolMarker: {
    position: "absolute", top: "55%", left: "50%", marginLeft: -18, marginTop: -18,
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.info,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6,
    elevation: 4,
  },
  busMarkerWrap: {
    position: "absolute", top: "55%", left: "50%",
    alignItems: "center", justifyContent: "center",
  },
  pulse: {
    position: "absolute", width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.brandPrimary, opacity: 0.25,
  },
  busMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#fff",
  },
  busLabel: { position: "absolute", top: 44, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border },
  busLabelText: { fontSize: 11, fontWeight: "600", color: theme.colors.onSurface },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderStrong, alignSelf: "center", marginBottom: theme.spacing.md },
  etaRow: {
    flexDirection: "row", paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brandTertiary, borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
  },
  etaLabel: { fontSize: 11, color: theme.colors.onBrandTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  etaValue: { fontSize: 20, fontWeight: "700", color: theme.colors.onBrandTertiary },
  etaValueSm: { fontSize: 15, fontWeight: "600", color: theme.colors.onBrandTertiary },
  etaDivider: { width: 1, backgroundColor: theme.colors.brandSecondary, marginHorizontal: theme.spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.onSurfaceTertiary, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontSize: 14, color: theme.colors.onSurface, flex: 1 },
  driverCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: theme.colors.surfaceTertiary, padding: theme.spacing.md, borderRadius: theme.radius.md,
  },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.info, alignItems: "center", justifyContent: "center" },
  driverInitial: { color: "#fff", fontSize: 18, fontWeight: "600" },
  driverName: { fontSize: 15, fontWeight: "600", color: theme.colors.onSurface },
  driverPhone: { fontSize: 12, color: theme.colors.onSurfaceTertiary, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  stopRow: { flexDirection: "row", gap: 12, paddingVertical: 6 },
  stopDotCol: { alignItems: "center", width: 14 },
  stopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.border, marginTop: 4 },
  stopDotActive: { backgroundColor: theme.colors.brandPrimary, width: 12, height: 12, borderRadius: 6 },
  stopLine: { width: 2, flex: 1, backgroundColor: theme.colors.border, marginTop: 4 },
  stopName: { fontSize: 14, color: theme.colors.onSurface, fontWeight: "500" },
  stopTime: { fontSize: 12, color: theme.colors.onSurfaceTertiary },
});
