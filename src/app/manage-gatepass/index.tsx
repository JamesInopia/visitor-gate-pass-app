import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useRequests } from "@/hooks/use-requests";
import { useTheme } from "@/hooks/use-theme";
import { describeForTenant } from "@/lib/gatepass-time";

export default function ManageGatepassScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, requests, problem, retry } = useRequests();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const now = new Date();
  const shown = requests
    .filter((r) => r.visitorName.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        Number(b.status === "pending") - Number(a.status === "pending") ||
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );

  if (status === "loading")
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading requests</ThemedText>
      </ThemedView>
    );

  if (status === "error")
    return (
      <ThemedView style={styles.middle}>
        <ThemedText>{problem}</ThemedText>
        <AppButton title="Try again" variant="outline" onPress={retry} />
      </ThemedView>
    );

  if (status === "empty")
    return (
      <ThemedView style={styles.middle}>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          There are no requests
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Just chill while waiting for a new one
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[styles.search, { backgroundColor: theme.backgroundElement }]}
      >
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a request"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <ThemedText type="subtitle" style={styles.title}>
        Incoming Requests
      </ThemedText>

      <View style={[styles.row, styles.headerRow]}>
        <ThemedText type="smallBold" style={styles.nameCol}>
          Request from:
        </ThemedText>
        <ThemedText type="smallBold" style={styles.statusCol}>
          Status
        </ThemedText>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          gap: Spacing.two,
          paddingBottom: Spacing.four,
        }}
        renderItem={({ item }) => {
          const d = describeForTenant(item, now);
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/manage-gatepass/${item.id}`)}
              style={({ pressed }) => [
                styles.row,
                styles.card,
                {
                  borderColor: theme.textSecondary,
                  backgroundColor: pressed
                    ? theme.backgroundSelected
                    : theme.background,
                },
              ]}
            >
              <View style={styles.nameCol}>
                <ThemedText type="smallBold">{item.visitorName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {d.detail}
                </ThemedText>
              </View>
              <View style={styles.statusCol}>
                <StatusBadge phase={d.phase} label={d.badge} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.noMatch}>
            No requests match &quot;{query}&quot;.
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: { fontSize: 24, lineHeight: 32, textAlign: "center" },
  screen: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.three, fontSize: 16 },
  title: { fontSize: 24, lineHeight: 32, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  headerRow: { paddingHorizontal: Spacing.three },
  card: { borderWidth: 1, borderRadius: 12, padding: Spacing.three },
  nameCol: { flex: 3 },
  statusCol: { flex: 2, alignItems: "flex-start" },
  noMatch: { textAlign: "center", paddingTop: Spacing.three },
});
