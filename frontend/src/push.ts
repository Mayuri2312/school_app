import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { API_BASE } from "@/src/theme";

/**
 * Registers the device for push notifications via the backend relay.
 * Silently no-ops on web or if permissions are denied / running in Expo Go.
 */
export async function registerForPush(userId: string) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    await fetch(`${API_BASE}/register-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        platform: Platform.OS,
        device_token: tokenResp.data,
      }),
    });
  } catch (e) {
    console.log("push registration skipped:", (e as Error).message);
  }
}
