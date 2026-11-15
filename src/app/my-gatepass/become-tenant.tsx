import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { problemFor } from "@/data/problem";
import {
  createTenantApplication,
  fetchMyTenantApplications,
  type TenantApplication,
} from "@/data/tenant-applications";
import { useProfile, useRefreshProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";

type Load = "loading" | "error" | "ready";

const validEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
// Room numbers look like "Unit 1001". The server fills in "Unit " if it is left out.
const validUnit = (s: string) => /\d/.test(s);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function submitProblem(e: unknown) {
  const err = e as Error & { code?: string };
  // The API explains validation problems in plain words; show them as they are.
  if (err?.message === "400" && err.code) return err.code;
  return problemFor(
    e,
    "That request is not there any more.",
    "You already have a request waiting for approval.",
  );
}

function BecomeTenant() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const refreshProfile = useRefreshProfile();

  const [load, setLoad] = useState<Load>("loading");
  const [latest, setLatest] = useState<TenantApplication | null>(null);
  const [problem, setProblem] = useState("");

  const [fullName, setFullName] = useState(profile.name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [unitNo, setUnitNo] = useState("");
  const [saving, setSaving] = useState(false);
  const prefilled = useRef(false);

  const fetchLatest = useCallback((quiet: boolean) => {
    if (!quiet) setLoad("loading");
    fetchMyTenantApplications()
      .then((rows) => {
        const mine = rows[0] ?? null;
        setLatest(mine);
        // After a rejection, start the new form from what was sent last time.
        if (mine && mine.status === "rejected" && !prefilled.current) {
          prefilled.current = true;
          setFullName(mine.fullName);
          setEmail(mine.email);
          setUnitNo(mine.unitNo);
        }
        setLoad("ready");
      })
      .catch((e) => {
        setProblem(problemFor(e));
        setLoad("error");
      });
  }, []);

  // Every time the screen comes into view: re-check the request, and re-read
  // the profile in case an admin has approved it and the role changed.
  useFocusEffect(
    useCallback(() => {
      fetchLatest(true);
      refreshProfile();
    }, [fetchLatest, refreshProfile]),
  );

  const valid =
    fullName.trim().length >= 2 &&
    validEmail(email.trim()) &&
    validUnit(unitNo.trim());

  function submit() {
    setSaving(true);
    setProblem("");
    createTenantApplication({
      fullName: fullName.trim(),
      email: email.trim(),
      unitNo: unitNo.trim(),
    })
      .then((created) => {
        setLatest(created);
        setSaving(false);
      })
      .catch((e) => {
        setProblem(submitProblem(e));
        setSaving(false);
      });
  }

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={goBack}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={theme.text} />
      <ThemedText>Back</ThemedText>
    </Pressable>
  );

  if (load === "loading")
    return (
      <ThemedView style={styles.screen}>
        {back}
        <View style={styles.middle}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );

  if (load === "error")
    return (
      <ThemedView style={styles.screen}>
        {back}
        <View style={styles.middle}>
          <ThemedText>{problem}</ThemedText>
          <AppButton
            title="Try again"
            variant="outline"
            onPress={() => fetchLatest(false)}
          />
        </View>
      </ThemedView>
    );

  // Waiting on an admin.
  if (latest?.status === "pending")
    return (
      <ThemedView style={styles.screen}>
        {back}
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Request sent</ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={{ color: "#c78a00" }}>
              Waiting for admin approval
            </ThemedText>
            <Detail label="Full name" value={latest.fullName} />
            <Detail label="Email" value={latest.email} />
            <Detail label="Room number" value={latest.unitNo} />
            <Detail label="Sent" value={formatDate(latest.requestedAt)} />
          </ThemedView>
          <ThemedText themeColor="textSecondary">
            You will become a tenant once an admin approves this. Check back
            here any time.
          </ThemedText>
          <AppButton
            title="Check again"
            variant="outline"
            onPress={() => {
              fetchLatest(true);
              refreshProfile();
            }}
          />
        </ScrollView>
      </ThemedView>
    );

  // Approved. The role flips to tenant as soon as the profile refresh lands,
  // and the role guard then sends the person Home.
  if (latest?.status === "approved")
    return (
      <ThemedView style={styles.screen}>
        {back}
        <View style={styles.middle}>
          <ThemedText type="subtitle">You are approved</ThemedText>
          <ThemedText themeColor="textSecondary">
            Setting up your tenant account.
          </ThemedText>
          <ActivityIndicator />
        </View>
      </ThemedView>
    );

  const input = {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 16,
    color: theme.text,
    borderColor: theme.textSecondary,
  };

  return (
    <ThemedView style={styles.screen}>
      {back}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <ThemedText type="subtitle">Become a tenant</ThemedText>
          <ThemedText themeColor="textSecondary">
            Fill this in and an admin will review it. You keep your visitor
            account until it is approved.
          </ThemedText>

          {latest?.status === "rejected" && (
            <ThemedView type="backgroundElement" style={styles.rejected}>
              <ThemedText type="smallBold" style={{ color: "#d64545" }}>
                Your last request was rejected
              </ThemedText>
              {latest.reviewNote ? (
                <ThemedText>{latest.reviewNote}</ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                You can fix the details and send a new request.
              </ThemedText>
            </ThemedView>
          )}

          <View style={{ gap: Spacing.one }}>
            <ThemedText type="small">Full name</ThemedText>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Juan Dela Cruz"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoComplete="name"
              editable={!saving}
              style={input}
            />
          </View>

          <View style={{ gap: Spacing.one }}>
            <ThemedText type="small">Email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. juan@email.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!saving}
              style={input}
            />
          </View>

          <View style={{ gap: Spacing.one }}>
            <ThemedText type="small">Room number</ThemedText>
            <TextInput
              value={unitNo}
              onChangeText={setUnitNo}
              placeholder="e.g. Unit 1001"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              editable={!saving}
              style={input}
            />
          </View>

          {problem !== "" && (
            <ThemedText type="small" style={{ color: "#d64545" }}>
              {problem}
            </ThemedText>
          )}

          <AppButton
            title="Send request"
            onPress={submit}
            disabled={!valid}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText>{value}</ThemedText>
    </View>
  );
}

export default function BecomeTenantScreen() {
  return <BecomeTenant />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  rejected: {
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#d64545",
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
