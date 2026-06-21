import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { api, ApiError, type Gamification, type Stats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function DashboardScreen() {
  const { token, user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [game, setGame] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [s, g] = await Promise.all([
          api.stats(token),
          api.gamification(token)
        ]);
        setStats(s);
        setGame(g);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load your data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hello}>
        Hi, {user?.display_name || user?.email || "learner"} 👋
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {game ? (
        <View style={styles.row}>
          <Stat label="Level" value={String(game.level)} />
          <Stat label="XP" value={String(game.xp)} />
          <Stat label="Streak" value={`${game.streak_days}d`} />
        </View>
      ) : null}

      {stats ? (
        <View style={styles.row}>
          <Stat label="Answered" value={String(stats.questions_answered)} />
          <Stat label="Correct" value={String(stats.correct)} />
          <Stat label="Accuracy" value={`${Math.round(stats.accuracy * 100)}%`} />
        </View>
      ) : null}

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  container: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  hello: { fontSize: 20, fontWeight: "700", color: colors.text },
  row: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: colors.card
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.brand },
  statLabel: { color: colors.muted, marginTop: spacing.xs },
  error: { color: colors.danger },
  logout: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center"
  },
  logoutText: { color: colors.danger, fontWeight: "700" }
});
