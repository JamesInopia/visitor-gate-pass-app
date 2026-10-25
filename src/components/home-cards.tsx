import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { Profile } from "@/data/profile";
import { useRequests } from "@/hooks/use-requests";
import { describe } from "@/lib/gatepass-time";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" style={styles.cardTitle}>
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card title="My Profile">
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" style={styles.name}>
          {profile.name}
        </ThemedText>
        {profile.email ? (
          <ThemedText themeColor="textSecondary">{profile.email}</ThemedText>
        ) : null}
        {profile.unitNo ? (
          <ThemedText themeColor="textSecondary">
            Unit / Room {profile.unitNo}
          </ThemedText>
        ) : null}
      </View>
    </Card>
  );
}

export function GatepassStatusCard() {
  const router = useRouter();
  const { status, requests, problem, retry } = useRequests();

  const now = new Date();
  const order = { active: 0, upcoming: 1, pending: 2 } as const;
  const relevant = requests
    .map((r) => ({ r, d: describe(r, now) }))
    .filter(({ d }) => d.phase in order)
    .sort(
      (a, b) =>
        order[a.d.phase as keyof typeof order] -
          order[b.d.phase as keyof typeof order] ||
        new Date(b.r.requestedAt).getTime() -
          new Date(a.r.requestedAt).getTime(),
    );
  const top = relevant[0];

  let body: ReactNode;
  if (status === "loading") {
    body = <ActivityIndicator />;
  } else if (status === "error") {
    body = (
      <View style={styles.stack}>
        <ThemedText>{problem}</ThemedText>
        <AppButton title="Try again" variant="outline" onPress={retry} />
      </View>
    );
  } else if (!top) {
    body = (
      <View style={styles.stack}>
        <ThemedText themeColor="textSecondary">
          You have no active or pending gatepass.
        </ThemedText>
        <AppButton
          title="Request a gatepass"
          onPress={() =>
            router.push({
              pathname: "/my-gatepass",
              params: { compose: String(Date.now()) },
            })
          }
        />
      </View>
    );
  } else {
    body = (
      <View style={styles.stack}>
        <View style={styles.between}>
          <ThemedText type="smallBold" style={{ flex: 1 }}>
            Visit to {top.r.hostName}
          </ThemedText>
          <StatusBadge phase={top.d.phase} label={top.d.badge} />
        </View>
        <ThemedText themeColor="textSecondary">{top.d.detail}</ThemedText>
        <AppButton
          title={
            relevant.length > 1
              ? `View all (${relevant.length})`
              : "View details"
          }
          variant="outline"
          onPress={() =>
            relevant.length > 1
              ? router.push("/my-gatepass")
              : router.push(`/my-gatepass/${top.r.id}`)
          }
        />
      </View>
    );
  }

  return <Card title="Gatepass Status">{body}</Card>;
}

export function UpcomingGatepassCard() {
  const router = useRouter();
  const { status, requests, problem, retry } = useRequests();

  const now = new Date();
  const upcoming = requests
    .map((r) => ({ r, d: describe(r, now) }))
    .filter(({ d }) => d.phase === "upcoming" || d.phase === "active")
    .sort(
      (a, b) =>
        new Date(a.r.pass?.startsAt ?? 0).getTime() -
        new Date(b.r.pass?.startsAt ?? 0).getTime(),
    );
  const shown = upcoming.slice(0, 3);

  let body: ReactNode;
  if (status === "loading") {
    body = <ActivityIndicator />;
  } else if (status === "error") {
    body = (
      <View style={styles.stack}>
        <ThemedText>{problem}</ThemedText>
        <AppButton title="Try again" variant="outline" onPress={retry} />
      </View>
    );
  } else if (shown.length === 0) {
    body = (
      <View style={styles.stack}>
        <ThemedText type="smallBold">No upcoming gatepasses</ThemedText>
        <ThemedText themeColor="textSecondary">
          Passes you approve for your visitors will show up here.
        </ThemedText>
      </View>
    );
  } else {
    body = (
      <View style={styles.stack}>
        {shown.map(({ r, d }) => (
          <View key={r.id} style={styles.upcomingRow}>
            <View style={styles.between}>
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {r.visitorName}
              </ThemedText>
              <StatusBadge phase={d.phase} label={d.badge} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {d.detail}
            </ThemedText>
          </View>
        ))}
        {upcoming.length > shown.length && (
          <AppButton
            title={`View all (${upcoming.length})`}
            variant="outline"
            onPress={() => router.push("/manage-gatepass")}
          />
        )}
      </View>
    );
  }

  return <Card title="Upcoming Gatepass">{body}</Card>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  cardTitle: { fontSize: 18, lineHeight: 24 },
  name: { fontSize: 24, lineHeight: 32 },
  stack: { gap: Spacing.three },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  upcomingRow: { gap: Spacing.one },
});
