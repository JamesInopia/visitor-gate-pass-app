import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { problemFor, type Status } from "@/data/problem";
import {
  DEFAULT_EXPIRY_HOURS,
  EXPIRY_HOURS,
  fetchRequest,
  respondToRequest,
  type GatepassRequest,
} from "@/data/requests";
import { useTheme } from "@/hooks/use-theme";
import {
  describeForTenant,
  formatDateTime,
  formatExpiryHours,
} from "@/lib/gatepass-time";

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

export default function IncomingRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [status, setStatus] = useState<Status>("loading");
  const [request, setRequest] = useState<GatepassRequest | null>(null);
  const [problem, setProblem] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [hours, setHours] = useState<number>(DEFAULT_EXPIRY_HOURS);
  const [confirming, setConfirming] = useState<"approve" | "deny" | null>(null);
  const [sending, setSending] = useState(false);

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
    router.canGoBack() ? router.back() : router.replace("/manage-gatepass");

  function submit(decision: "approve" | "deny") {
    setSending(true);
    setProblem("");
    respondToRequest(
      id,
      decision === "approve"
        ? { decision, expiresInHours: hours }
        : { decision },
    )
      .then((row) => {
        setRequest(row);
        setConfirming(null);
        setSending(false);
      })
      .catch((e) => {
        setProblem(
          problemFor(
            e,
            undefined,
            "This request was already answered. Go back to refresh the list.",
          ),
        );
        setSending(false);
        setConfirming(null);
      });
  }

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to incoming requests"
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

  const d = describeForTenant(request);
  const isPending = request.status === "pending";

  return (
    <ThemedView style={styles.screen}>
      {back}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.name}>
            {request.visitorName}
          </ThemedText>
          <StatusBadge phase={d.phase} label={d.badge} />
        </View>
        <ThemedText themeColor="textSecondary">{d.detail}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <Field label="Purpose of visit" value={request.purpose} />
          {request.visitorContact ? (
            <Field label="Contact" value={request.visitorContact} />
          ) : null}
          {request.unitNo ? (
            <Field label="Unit / Room" value={request.unitNo} />
          ) : null}
          <Field label="Requested" value={formatDateTime(request.requestedAt)} />
          {request.respondedAt ? (
            <Field
              label={request.status === "denied" ? "Rejected" : "Accepted"}
              value={formatDateTime(request.respondedAt)}
            />
          ) : null}
        </ThemedView>

        {request.pass && !isPending && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Gatepass</ThemedText>
            <Field label="Takes effect" value={formatDateTime(request.pass.startsAt)} />
            <Field label="Expires" value={formatDateTime(request.pass.expiresAt)} />
          </ThemedView>
        )}

        {problem !== "" && (
          <ThemedText type="small" style={{ color: "#d64545" }}>
            {problem}
          </ThemedText>
        )}

        {isPending && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Pass expires after</ThemedText>
              <View style={styles.chips}>
                {EXPIRY_HOURS.map((h) => {
                  const selected = h === hours;
                  return (
                    <Pressable
                      key={h}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      disabled={sending}
                      onPress={() => setHours(h)}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? "#3c87f7" : theme.textSecondary,
                          backgroundColor: selected ? "#3c87f7" : "transparent",
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: selected ? "#ffffff" : theme.text }}
                      >
                        {h} hr
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {formatExpiryHours(hours)} from when you accept.
              </ThemedText>
            </ThemedView>

            {confirming ? (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText>
                  {confirming === "approve"
                    ? `Accept ${request.visitorName} for ${hours} ${hours === 1 ? "hour" : "hours"}?`
                    : `Reject ${request.visitorName}? This cannot be undone.`}
                </ThemedText>
                <View style={{ flexDirection: "row", gap: Spacing.three }}>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Go back"
                      variant="outline"
                      onPress={() => setConfirming(null)}
                      disabled={sending}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="Yes, continue"
                      variant={confirming === "approve" ? "primary" : "danger"}
                      onPress={() => submit(confirming)}
                      loading={sending}
                    />
                  </View>
                </View>
              </ThemedView>
            ) : (
              <View style={{ flexDirection: "row", gap: Spacing.three }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Reject"
                    variant="danger"
                    onPress={() => setConfirming("deny")}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Accept"
                    onPress={() => setConfirming("approve")}
                  />
                </View>
              </View>
            )}
          </>
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
  name: { flex: 1, fontSize: 28, lineHeight: 36 },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    minWidth: 56,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
});
