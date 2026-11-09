import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { GatepassDetails } from "@/components/gatepass-details";
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
import { describe } from "@/lib/gatepass-time";

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

  // An accepted (upcoming or active) gatepass lives on the My Gatepass screen
  // itself, with no back button. Only the tenant can cancel or expire it.
  if (d.phase === "upcoming" || d.phase === "active")
    return <Redirect href="/my-gatepass" />;

  const cancelLabel =
    d.phase === "pending" ? "Cancel request" : "Delete request";

  return (
    <ThemedView style={styles.screen}>
      {back}
      <ScrollView contentContainerStyle={styles.content}>
        <GatepassDetails request={request} />

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
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
});
