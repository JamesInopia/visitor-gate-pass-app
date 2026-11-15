import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { GatepassDetails } from "@/components/gatepass-details";
import { NewRequestModal } from "@/components/new-request-modal";
import { NoticeList } from "@/components/notice-list";
import { RequestHeaderRow, RequestRow } from "@/components/request-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useRequests } from "@/hooks/use-requests";
import { useTheme } from "@/hooks/use-theme";
import { phaseOf } from "@/lib/gatepass-time";

export default function MyGatepassScreen() {
  const theme = useTheme();
  const { status, requests, problem, retry, refresh } = useRequests();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const { compose } = useLocalSearchParams<{ compose?: string }>();
  useEffect(() => {
    if (compose) setAdding(true);
  }, [compose]);

  const q = query.trim().toLowerCase();
  const now = new Date();

  // The accepted gatepass (upcoming or active). While one exists it takes over
  // this screen: other requests were cancelled and new ones can't be sent.
  const approved = requests
    .filter((r) => {
      const p = phaseOf(r, now);
      return p === "upcoming" || p === "active";
    })
    .sort(
      (a, b) =>
        new Date(a.pass?.startsAt ?? 0).getTime() -
        new Date(b.pass?.startsAt ?? 0).getTime(),
    )[0];

  const pending = requests
    .filter((r) => phaseOf(r, now) === "pending")
    .filter(
      (r) =>
        r.hostName.toLowerCase().includes(q) ||
        (r.unitNo ?? "").toLowerCase().includes(q),
    )
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
  const hasPending = requests.some((r) => phaseOf(r, now) === "pending");

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
  } else if (approved) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        <GatepassDetails request={approved} />
        <View style={{ height: Spacing.three }} />
      </ScrollView>
    );
  } else if (!hasPending) {
    body = (
      <View style={styles.middle}>
        <ThemedText style={styles.emptyTitle}>No Requests</ThemedText>
        <AppButton
          variant="brand"
          icon="add"
          title="Make a request"
          style={{ alignSelf: "stretch" }}
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

        <RequestHeaderRow />

        <FlatList
          data={pending}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ gap: Spacing.two, paddingBottom: 96 }}
          renderItem={({ item }) => <RequestRow request={item} now={now} />}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.noMatch}>
              No requests match &quot;{query}&quot;.
            </ThemedText>
          }
        />
      </View>
    );
  }

  const canRequest = status !== "loading" && status !== "error" && !approved;

  return (
    <ThemedView style={{ flex: 1 }}>
      <NoticeList style={styles.notices} />
      {body}

      {canRequest && hasPending && (
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
        visible={adding && canRequest}
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
    padding: Spacing.three,
  },
  emptyTitle: { fontSize: 32, lineHeight: 40, fontWeight: "800", textAlign: "center" },
  screen: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.three, fontSize: 16 },
  title: { fontSize: 24, lineHeight: 32, textAlign: "center" },
  notices: { padding: Spacing.three, paddingBottom: 0 },
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
