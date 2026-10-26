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
import { TimeField } from "@/components/time-field";
import { Spacing } from "@/constants/theme";
import { problemFor, type Status } from "@/data/problem";
import {
  approveRequest,
  denyRequest,
  fetchRequest,
  type GatepassRequest,
} from "@/data/requests";
import { useTheme } from "@/hooks/use-theme";
import {
  describeForTenant,
  formatDateTime,
  visitDateOf,
} from "@/lib/gatepass-time";
import {
  DAY_END,
  END_OPTIONS,
  formatMinutes,
  formatVisitDate,
  windowFor,
} from "@/lib/visit-date";

type Mode = "allDay" | "custom";

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
  const [mode, setMode] = useState<Mode>("allDay");
  const [startMin, setStartMin] = useState(9 * 60);
  const [endMin, setEndMin] = useState(17 * 60);
  const [timeProblem, setTimeProblem] = useState("");
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

  function chooseStart(m: number) {
    if (m >= DAY_END) {
      setTimeProblem("The start time must be before 11:59 PM.");
      return;
    }
    setTimeProblem("");
    setStartMin(m);
    if (endMin <= m) setEndMin(END_OPTIONS.find((o) => o > m) ?? DAY_END);
  }

  function chooseEnd(m: number) {
    if (m <= startMin) {
      setTimeProblem("The end time must be after the start time.");
      return;
    }
    setTimeProblem("");
    setEndMin(m);
  }

  const from = mode === "allDay" ? 0 : startMin;
  const to = mode === "allDay" ? DAY_END : endMin;
  const scheduleText =
    mode === "allDay"
      ? "all day (12:00 AM – 11:59 PM)"
      : `${formatMinutes(from)} – ${formatMinutes(to)}`;

  function submit(decision: "approve" | "deny") {
    if (!request) return;
    setSending(true);
    setProblem("");
    const done =
      decision === "approve"
        ? approveRequest(id, windowFor(visitDateOf(request), from, to)).then(
            (row) => {
              setRequest(row);
              setConfirming(null);
              setSending(false);
            },
          )
        : denyRequest(id).then(goBack);
    done.catch((e) => {
      setProblem(
        problemFor(
          e,
          undefined,
          "This request was already answered or cancelled. Go back to refresh the list.",
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
  const canRespond = d.phase === "pending";
  const visit = formatVisitDate(visitDateOf(request));

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
          <Field label="Date of visit" value={visit} />
          <Field label="Purpose of visit" value={request.purpose} />
          {request.visitorContact ? (
            <Field label="Contact" value={request.visitorContact} />
          ) : null}
          {request.unitNo ? (
            <Field label="Unit / Room" value={request.unitNo} />
          ) : null}
          <Field
            label="Requested"
            value={formatDateTime(request.requestedAt)}
          />
          {request.respondedAt ? (
            <Field
              label={
                request.status === "denied"
                  ? "Rejected"
                  : request.status === "cancelled"
                    ? "Cancelled"
                    : "Accepted"
              }
              value={formatDateTime(request.respondedAt)}
            />
          ) : null}
        </ThemedView>

        {request.pass && !canRespond && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Gatepass</ThemedText>
            <Field label="Valid on" value={d.schedule} />
          </ThemedView>
        )}

        {problem !== "" && (
          <ThemedText type="small" style={{ color: "#d64545" }}>
            {problem}
          </ThemedText>
        )}

        {canRespond && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">When can they come in?</ThemedText>
              <View style={styles.chips}>
                {(
                  [
                    ["allDay", "All day"],
                    ["custom", "Set a time"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = mode === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      disabled={sending}
                      onPress={() => setMode(value)}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected
                            ? "#3c87f7"
                            : theme.textSecondary,
                          backgroundColor: selected ? "#3c87f7" : "transparent",
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: selected ? "#ffffff" : theme.text }}
                      >
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {mode === "custom" && (
                <>
                  <TimeField
                    label="From"
                    value={startMin}
                    onChange={chooseStart}
                    disabled={sending}
                  />
                  <TimeField
                    label="To"
                    value={endMin}
                    onChange={chooseEnd}
                    disabled={sending}
                  />
                  {timeProblem !== "" && (
                    <ThemedText type="small" style={{ color: "#d64545" }}>
                      {timeProblem}
                    </ThemedText>
                  )}
                </>
              )}

              <ThemedText type="small" themeColor="textSecondary">
                The pass will only work on {visit}, {scheduleText}.
              </ThemedText>
            </ThemedView>

            {confirming ? (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText>
                  {confirming === "approve"
                    ? `Accept ${request.visitorName} on ${visit}, ${scheduleText}?`
                    : `Reject ${request.visitorName}? The request will be deleted and they will be told it was denied.`}
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
    minWidth: 96,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
});
