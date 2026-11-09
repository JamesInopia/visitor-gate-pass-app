import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { RoleGuard } from "@/components/role-guard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  TenantHeaderRow,
  TenantRequestRow,
} from "@/components/tenant-request-row";
import { Spacing } from "@/constants/theme";
import type { GatepassRequest } from "@/data/requests";
import { useRequests } from "@/hooks/use-requests";
import { phaseOf } from "@/lib/gatepass-time";

const startsAt = (r: GatepassRequest) =>
  new Date(r.pass?.startsAt ?? r.requestedAt).getTime();

function Section({
  title,
  items,
  now,
}: {
  title: string;
  items: GatepassRequest[];
  now: Date;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <TenantHeaderRow />
      {items.map((r) => (
        <TenantRequestRow key={r.id} request={r} now={now} />
      ))}
    </View>
  );
}

function ManageHistory() {
  const { status, requests, problem, retry } = useRequests();
  const now = new Date();

  // Only expired gatepasses. Pending, active and approved ones stay in
  // Manage Gatepass.
  const expired = requests
    .filter((r) => r.status === "approved" && phaseOf(r, now) === "expired")
    .sort((a, b) => startsAt(b) - startsAt(a));

  if (status === "loading")
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading history</ThemedText>
      </ThemedView>
    );

  if (status === "error")
    return (
      <ThemedView style={styles.middle}>
        <ThemedText>{problem}</ThemedText>
        <AppButton title="Try again" variant="outline" onPress={retry} />
      </ThemedView>
    );

  if (expired.length === 0)
    return (
      <ThemedView style={styles.middle}>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          There is no history yet
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center" }}>
          Gatepasses show up here once they expire.
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.list}>
        <Section title="Expired" items={expired} now={now} />
      </ScrollView>
    </ThemedView>
  );
}

export default function ManageHistoryScreen() {
  return (
    <RoleGuard route="manage-history">
      <ManageHistory />
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
  list: { padding: Spacing.three, gap: Spacing.four },
  section: { gap: Spacing.two },
  title: { fontSize: 24, lineHeight: 32, textAlign: "center" },
});
