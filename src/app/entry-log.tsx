import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { RoleGuard } from "@/components/role-guard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Spacing } from "@/constants/theme";
import { fetchEntryLog, type EntryEvent } from "@/data/scan";
import { useFocusList } from "@/hooks/use-focus-list";
import { useTheme } from "@/hooks/use-theme";

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
      {event.photoUrl ? (
        <Image source={{ uri: event.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="person" size={22} color={theme.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{event.visitorName}</ThemedText>
        <ThemedText type="small">
          Code:{" "}
          <ThemedText type="smallBold" style={styles.code}>
            {event.code}
          </ThemedText>
        </ThemedText>
      </View>
      <View style={[styles.pill, { backgroundColor: entering ? Brand.green : Brand.red }]}>
        <ThemedText type="small" style={{ color: "#000000" }}>
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
    <View style={styles.page}>
      <View style={styles.panel}>
        <ThemedText style={styles.heading}>Entry Log</ThemedText>
        <FlatList
          data={items}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshing={false}
          onRefresh={refresh}
          renderItem={({ item }) => <EventRow event={item} />}
        />
      </View>
    </View>
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
  page: { flex: 1, backgroundColor: Brand.logBg, padding: Spacing.three },
  panel: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: Spacing.three,
    color: "#000000",
  },
  list: { padding: Spacing.three, paddingTop: 0, gap: Spacing.three },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  code: { textDecorationLine: "underline" },
  pill: {
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
});
