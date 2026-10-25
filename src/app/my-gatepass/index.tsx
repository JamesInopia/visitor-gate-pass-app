import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { NewRequestModal } from "@/components/new-request-modal";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useRequests } from "@/hooks/use-requests";
import { useTheme } from "@/hooks/use-theme";
import { describe } from "@/lib/gatepass-time";

export default function MyGatepassScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, requests, problem, retry, refresh } = useRequests();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const { compose } = useLocalSearchParams<{ compose?: string }>();
  useEffect(() => {
    if (compose) setAdding(true);
  }, [compose]);

  const q = query.trim().toLowerCase();
  const now = new Date();
  const shown = requests
    .filter(
      (r) =>
        r.hostName.toLowerCase().includes(q) ||
        (r.unitNo ?? "").toLowerCase().includes(q),
    )
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );

  let body;
  if (status === "loading") {
    body = (
      <View style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading requests</ThemedText>
      </View>
    );
  } else if (status === "error") {
    body = (
      <View style={styles.middle}>
        <ThemedText>{problem}</ThemedText>
        <AppButton title="Try again" variant="outline" onPress={retry} />
      </View>
    );
  } else if (status === "empty") {
    body = (
      <View style={styles.middle}>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          There are no requests
        </ThemedText>
        <AppButton
          title="Wanna add one?"
          variant="outline"
          onPress={() => setAdding(true)}
        />
      </View>
    );
  } else {
    body = (
      <View style={styles.screen}>
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
          Your Requests
        </ThemedText>

        <View
          style={[
            styles.row,
            styles.headerRow,
            { borderColor: theme.textSecondary },
          ]}
        >
          <ThemedText type="smallBold" style={styles.nameCol}>
            Request Sent to:
          </ThemedText>
          <ThemedText type="smallBold" style={styles.statusCol}>
            Status
          </ThemedText>
        </View>

        <FlatList
          data={shown}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: 96 }}
          renderItem={({ item }) => {
            const d = describe(item, now);
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/my-gatepass/${item.id}`)}
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
                  <ThemedText type="smallBold">{item.hostName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.unitNo ? `Unit ${item.unitNo} · ` : ""}
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
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {body}

      {status === "content" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Request a gatepass"
          onPress={() => setAdding(true)}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.background,
              borderColor: theme.text,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={32} color={theme.text} />
        </Pressable>
      )}

      <NewRequestModal
        visible={adding}
        onClose={() => setAdding(false)}
        onCreated={refresh}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  headerRow: { paddingHorizontal: Spacing.three },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  nameCol: { flex: 3 },
  statusCol: { flex: 2, alignItems: "flex-start" },
  noMatch: { textAlign: "center", paddingTop: Spacing.three },
  fab: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.three,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
