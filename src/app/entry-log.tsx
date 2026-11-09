import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { RoleGuard } from "@/components/role-guard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { fetchEntryLog, type EntryEvent } from "@/data/scan";
import { useFocusList } from "@/hooks/use-focus-list";
import { useTheme } from "@/hooks/use-theme";
import { formatDateTime } from "@/lib/gatepass-time";

const GREEN = "#2e9e5b";
const RED = "#d64545";

function EventRow({ event }: { event: EntryEvent }) {
  const theme = useTheme();
  const entering = event.kind === "enter";

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name="person" size={22} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{event.visitorName}</ThemedText>
        <ThemedText type="small">
          Code:{" "}
          <ThemedText type="smallBold" style={styles.code}>
            {event.code}
          </ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateTime(event.at)}
        </ThemedText>
      </View>
      <View style={[styles.pill, { backgroundColor: entering ? GREEN : RED }]}>
        <ThemedText type="smallBold" style={{ color: "#ffffff" }}>
          {entering ? "Enter" : "Exit"}
        </ThemedText>
      </View>
    </View>
  );
}

function EntryLog() {
  const { status, items, problem, retry, refresh } =
    useFocusList(fetchEntryLog);

  if (status === "loading")
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading entry log</ThemedText>
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
          No entries yet
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center" }}>
          Entries and exits show up here after a gatepass is scanned.
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshing={false}
        onRefresh={refresh}
        renderItem={({ item }) => <EventRow event={item} />}
      />
    </ThemedView>
  );
}

export default function EntryLogScreen() {
  return (
    <RoleGuard route="entry-log">
      <EntryLog />
    </RoleGuard>
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
  list: { padding: Spacing.three, gap: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  code: { textDecorationLine: "underline" },
  pill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
});
