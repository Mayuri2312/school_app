import { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/src/ui";
import { theme, API_BASE } from "@/src/theme";
import { useAuth } from "@/src/auth";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain fractions with an example",
  "Help me with this math word problem",
  "What are the parts of a plant cell?",
  "Tips for memorising vocabulary",
];

export default function AIHelper() {
  const router = useRouter();
  const { student } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!student) return;
    fetch(`${API_BASE}/ai/messages/${student.id}`)
      .then((r) => r.json())
      .then((j) => setMessages(j || []))
      .finally(() => setLoadingHistory(false));
  }, [student?.id]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, busy]);

  async function sendMessage(text: string) {
    if (!student || !text.trim()) return;
    const tempUser: Msg = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((m) => [...m, tempUser]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/ai/chat-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student.id, message: text.trim() }),
      });
      const j = await r.json();
      const assistant: Msg = {
        id: j.message?.id || `a-${Date.now()}`,
        role: "assistant",
        content: j.reply || "(no response)",
      };
      setMessages((m) => [...m, assistant]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title="AI Homework Helper"
        subtitle={`Class ${student?.class || ""} tutor`}
        onBack={() => router.back()}
        right={<Ionicons name="sparkles" size={20} color={theme.colors.brandPrimary} />}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {loadingHistory ? (
          <ActivityIndicator color={theme.colors.brandPrimary} style={{ marginTop: 24 }} />
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="sparkles" size={28} color={theme.colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Ask me anything!</Text>
            <Text style={styles.emptySub}>
              I'll help {student?.name?.split(" ")[0]} understand homework step by step.
            </Text>
            <View style={styles.suggestWrap}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  testID={`suggest-${s.slice(0, 12)}`}
                  style={styles.suggestPill}
                  onPress={() => sendMessage(s)}
                >
                  <Text style={styles.suggestText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}
              testID={`msg-${m.role}`}
            >
              <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>
                {m.content}
              </Text>
            </View>
          ))
        )}
        {busy && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <ActivityIndicator color={theme.colors.brandPrimary} size="small" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          testID="ai-input"
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question..."
          placeholderTextColor={theme.colors.onSurfaceTertiary}
          style={styles.textInput}
          editable={!busy}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <Pressable
          testID="ai-send-button"
          style={[styles.sendBtn, (!input.trim() || busy) && { opacity: 0.5 }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || busy}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", marginTop: 32 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: theme.colors.onSurface },
  emptySub: { fontSize: 13, color: theme.colors.onSurfaceTertiary, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },
  suggestWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spacing.xl, justifyContent: "center" },
  suggestPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  suggestText: { fontSize: 13, color: theme.colors.onSurface },
  bubble: { padding: theme.spacing.md, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm, maxWidth: "85%" },
  userBubble: { backgroundColor: theme.colors.brandPrimary, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: theme.colors.surfaceSecondary, alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  bubbleText: { fontSize: 14, color: theme.colors.onSurface, lineHeight: 20 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: theme.spacing.md, paddingBottom: Platform.OS === "ios" ? theme.spacing.xl : theme.spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  textInput: { flex: 1, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceTertiary, paddingHorizontal: 16, fontSize: 14, color: theme.colors.onSurface },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.brandPrimary, alignItems: "center", justifyContent: "center" },
});
