import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { Field } from "@/components/gatepass-details";
import { RequestHeaderRow, RequestRow } from "@/components/request-row";
import { RoleGuard } from "@/components/role-guard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { fetchVisits, type Visit } from "@/data/visits";
import { useFocusList } from "@/hooks/use-focus-list";
import { useRequests } from "@/hooks/use-requests";
import { formatDateTime, phaseOf } from "@/lib/gatepass-time";
import { formatVisitDate, toDateKey } from "@/lib/visit-date";

function VisitCard({ visit }: { visit: Visit }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={{ gap: 2 }}>
        <ThemedText type="smallBold" style={styles.host}>
          {visit.hostName ?? "Unknown host"}
        </ThemedText>
        {visit.dateEnter ? (
          <ThemedText themeColor="textSecondary">
            {formatVisitDate(toDateKey(new Date(visit.dateEnter)))}
          </ThemedText>
        ) : null}
      </View>
      {visit.unitNo ? <Field label="Unit / Room" value={visit.unitNo} /> : null}
      {visit.purpose ? (
        <Field label="Purpose of visit" value={visit.purpose} />
      ) : null}
      <Field
        label="First entry"
        value={visit.dateEnter ? formatDateTime(visit.dateEnter) : "—"}
      />
      <Field
        label="Last exit"
        value={visit.dateExit ? formatDateTime(visit.dateExit) : "No exit recorded"}
      />
    </ThemedView>
  );
}

function VisitHistory() {
  const visits = useFocusList(fetchVisits);
  const reqs = useRequests();

  const now = new Date();
  // Only approved gatepasses: active now or already expired. Pending, denied
  // and cancelled requests are left out.
  const past = reqs.requests
    .filter((r) => {
      if (r.status !== "approved") return false;
      const p = phaseOf(r, now);
      return p === "active" || p === "expired";
    })
    .sort(
      (a, b) =>
        new Date(b.pass?.startsAt ?? b.requestedAt).getTime() -
        new Date(a.pass?.startsAt ?? a.requestedAt).getTime(),
    );

  if (visits.status === "loading" || reqs.status === "loading")
    return (
      <ThemedView style={styles.middle}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading history</ThemedText>
      </ThemedView>
    );

  if (visits.status === "error" || reqs.status === "error")
    return (
      <ThemedView style={styles.middle}>
        <ThemedText>{visits.problem || reqs.problem}</ThemedText>
        <AppButton
          title="Try again"
          variant="outline"
          onPress={() => {
            visits.retry();
            reqs.retry();
          }}
        />
      </ThemedView>
    );

  if (past.length === 0 && visits.items.length === 0)
    return (
      <ThemedView style={styles.middle}>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          There is no history yet
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center" }}>
          Active and expired gatepasses, and your visits, show up here.
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.list}>
        {past.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.title}>
              Your Requests
            </ThemedText>
            <RequestHeaderRow />
            {past.map((r) => (
              <RequestRow key={r.id} request={r} now={now} />
            ))}
          </View>
        )}

        {visits.items.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.title}>
              Visits
            </ThemedText>
            {visits.items.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

export default function VisitHistoryScreen() {
  return (
    <RoleGuard route="visit-history">
      <VisitHistory />
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
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  host: { fontSize: 18, lineHeight: 24 },
});
