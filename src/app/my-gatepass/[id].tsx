import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { problemFor, type Status } from "@/data/problem";
import {
  deleteRequest,
  fetchRequest,
  type GatepassRequest,
} from "@/data/requests";
import { useTheme } from "@/hooks/use-theme";
import {
  describe,
  formatDateTime,
  visitDateOf,
} from "@/lib/gatepass-time";
import { formatVisitDate } from "@/lib/visit-date";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

export default function GatepassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [status, setStatus] = useState<Status>("loading");
  const [request, setRequest] = useState<GatepassRequest | null>(null);
  const [problem, setProblem] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let live = true;
    fetchRequest(id)
      .then((row) => {
        if (!live) return;
        setRequest(row);
        setStatus("content");
      })
      .catch((e) => {
        if (!live) return;
        setProblem(problemFor(e));
        setStatus("error");
      });
    return () => {
      live = false;
    };
  }, [id, attempt]);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/my-gatepass");

  function cancelRequest() {
    setDeleting(true);
    setProblem("");
    deleteRequest(id)
      .then(goBack)
      .catch((e) => {
        setProblem(problemFor(e));
        setDeleting(false);
        setConfirming(false);
      });
  }

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to my gatepasses"
      hitSlop={12}
      onPress={goBack}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={theme.text} />
      <ThemedText>Back</ThemedText>
    </Pressable>
  );

  if (status === "loading")
    return (
      <ThemedView style={styles.screen}>
        {back}
        <View style={styles.middle}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );

  if (status === "error" || !request)
    return (
      <ThemedView style={styles.screen}>
        {back}
        <View style={styles.middle}>
          <ThemedText>{problem}</ThemedText>
          <AppButton
            title="Try again"
            variant="outline"
            onPress={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          />
        </View>
      </ThemedView>
    );

  const d = describe(request);
  const cancelLabel =
    d.phase === "pending"
      ? "Cancel request"
      : d.phase === "denied" ||
          d.phase === "expired" ||
          d.phase === "cancelled"
        ? "Delete request"
        : "Cancel gatepass";

  return (
    <ThemedView style={styles.screen}>
      {back}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.hostName}>
            {request.hostName}
          </ThemedText>
          <StatusBadge phase={d.phase} label={d.badge} />
        </View>
        <ThemedText themeColor="textSecondary">{d.detail}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          {request.unitNo ? (
            <Field label="Unit / Room" value={request.unitNo} />
          ) : null}
          <Field
            label="Date of visit"
            value={formatVisitDate(visitDateOf(request))}
          />
          <Field label="Purpose of visit" value={request.purpose} />
          <Field label="Requested" value={formatDateTime(request.requestedAt)} />
          {request.respondedAt ? (
            <Field
              label={
                request.status === "denied"
                  ? "Denied"
                  : request.status === "cancelled"
                    ? "Cancelled"
                    : "Approved"
              }
              value={formatDateTime(request.respondedAt)}
            />
          ) : null}
        </ThemedView>

        {request.pass && d.phase !== "expired" && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Gatepass</ThemedText>
            <View style={{ gap: 2 }}>
              <ThemedText type="small" themeColor="textSecondary">
                Code (show this at the entrance)
              </ThemedText>
              <ThemedText type="code" selectable style={styles.code}>
                {request.pass.code}
              </ThemedText>
            </View>
            <Field label="Valid on" value={d.schedule} />
          </ThemedView>
        )}

        {problem !== "" && (
          <ThemedText type="small" style={{ color: "#d64545" }}>
            {problem}
          </ThemedText>
        )}

        {confirming ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText>Are you sure? This cannot be undone.</ThemedText>
            <View style={{ flexDirection: "row", gap: Spacing.three }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Keep it"
                  variant="outline"
                  onPress={() => setConfirming(false)}
                  disabled={deleting}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Yes, continue"
                  variant="danger"
                  onPress={cancelRequest}
                  loading={deleting}
                />
              </View>
            </View>
          </ThemedView>
        ) : (
          <AppButton
            title={cancelLabel}
            variant="danger"
            onPress={() => setConfirming(true)}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  content: { padding: Spacing.three, gap: Spacing.three },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  hostName: { flex: 1, fontSize: 28, lineHeight: 36 },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  code: { fontSize: 24, lineHeight: 32, letterSpacing: 2 },
});
