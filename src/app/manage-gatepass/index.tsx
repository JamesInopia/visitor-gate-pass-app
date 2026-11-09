import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import {
  TenantHeaderRow,
  TenantRequestRow,
} from "@/components/tenant-request-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useRequests } from "@/hooks/use-requests";
import { useTheme } from "@/hooks/use-theme";
import { phaseOf } from "@/lib/gatepass-time";

export default function ManageGatepassScreen() {
  const theme = useTheme();
  const { status, requests, problem, retry } = useRequests();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const now = new Date();
  // Active and approved gatepasses stay here; only expired approved passes
  // move to the History tab.
  const visible = requests.filter(
    (r) =>
      r.status !== "cancelled" &&
      !(r.status === "approved" && phaseOf(r, now) === "expired"),
  );
  const shown = visible
    .filter((r) => r.visitorName.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        Number(phaseOf(b, now) === "pending") -
          Number(phaseOf(a, now) === "pending") ||
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

  if (status === "empty" || (status === "content" && visible.length === 0))
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

      <TenantHeaderRow />

      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          gap: Spacing.two,
          paddingBottom: Spacing.four,
        }}
        renderItem={({ item }) => <TenantRequestRow request={item} now={now} />}
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
  noMatch: { textAlign: "center", paddingTop: Spacing.three },
});
