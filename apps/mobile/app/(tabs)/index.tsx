import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { api, ApiError, type Level } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

export default function LevelsScreen() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLevels(await api.levels());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load levels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={levels}
      keyExtractor={(item) => item.code}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />
      }
      ListHeaderComponent={
        <Text style={styles.heading}>Choose your HSK level</Text>
      }
      ListEmptyComponent={
        <Text style={styles.muted}>
          {error ?? "No levels available yet."}
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.is_vip ? <Text style={styles.vip}>VIP</Text> : null}
          </View>
          {item.description ? (
            <Text style={styles.muted}>{item.description}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  heading: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  vip: {
    color: colors.brandDark,
    fontWeight: "800",
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.brandDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  muted: { color: colors.muted }
});
