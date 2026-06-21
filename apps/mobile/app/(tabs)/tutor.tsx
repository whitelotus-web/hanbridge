import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

interface Msg {
  role: "user" | "tutor";
  text: string;
}

export default function TutorScreen() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || !token) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const { reply } = await api.tutorChat(token, text);
      setMessages((m) => [...m, { role: "tutor", text: reply }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "The tutor is unavailable.";
      setMessages((m) => [...m, { role: "tutor", text: msg }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.feed}>
        {messages.length === 0 ? (
          <Text style={styles.muted}>
            Ask the AI tutor anything about Chinese or the HSK exam.
          </Text>
        ) : (
          messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === "user" ? styles.user : styles.tutor
              ]}
            >
              <Text style={m.role === "user" ? styles.userText : styles.tutorText}>
                {m.text}
              </Text>
            </View>
          ))
        )}
        {busy ? <ActivityIndicator color={colors.brand} /> : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a question…"
          value={input}
          onChangeText={setInput}
          placeholderTextColor={colors.muted}
          editable={!busy}
          onSubmitEditing={send}
        />
        <Pressable
          style={[styles.send, busy && styles.sendDisabled]}
          onPress={send}
          disabled={busy}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  feed: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  muted: { color: colors.muted },
  bubble: { maxWidth: "85%", borderRadius: radius.lg, padding: spacing.md },
  user: { alignSelf: "flex-end", backgroundColor: colors.brand },
  tutor: { alignSelf: "flex-start", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  userText: { color: "#fff" },
  tutorText: { color: colors.text },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    backgroundColor: colors.card
  },
  send: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center"
  },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: "#fff", fontWeight: "700" }
});
