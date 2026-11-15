import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/app-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
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

// Includes the HTTP status so a failing backend is easy to spot.
function loadProblem(e: unknown) {
  const base = problemFor(e);
  return e instanceof Error && /^\d{3}$/.test(e.message)
    ? `${base} (server error ${e.message})`
    : base;
}

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

/**
 * The "Become a tenant" form, shown as a bottom sheet inside a Modal that the
 * caller owns. Handles every state: loading, error, waiting for an admin,
 * approved, rejected (form again, with the admin's note) and first-time form.
 */
export function BecomeTenantSheet({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
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
        setProblem(loadProblem(e));
        setLoad("error");
      });
  }, []);

  // When the sheet opens: load the request status, and re-read the profile in
  // case an admin has approved it and the role changed.
  useEffect(() => {
    fetchLatest(false);
    refreshProfile();
  }, [fetchLatest, refreshProfile]);

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

  const input = {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 16,
    color: theme.text,
    borderColor: theme.textSecondary,
  };

  let content;

  if (load === "loading") {
    content = (
      <View style={{ alignItems: "center", gap: Spacing.three }}>
        <ActivityIndicator size="large" />
        <ThemedText themeColor="textSecondary">Loading</ThemedText>
        <AppButton title="Close" variant="outline" onPress={onClose} />
      </View>
    );
  } else if (load === "error") {
    content = (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">Become a tenant</ThemedText>
        <ThemedText>{problem}</ThemedText>
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <View style={{ flex: 1 }}>
            <AppButton title="Close" variant="outline" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton title="Try again" onPress={() => fetchLatest(false)} />
          </View>
        </View>
      </View>
    );
  } else if (latest?.status === "pending") {
    // Waiting on an admin.
    content = (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">Request sent</ThemedText>
        <ThemedView
          type="backgroundElement"
          style={{ borderRadius: 12, padding: Spacing.three, gap: Spacing.three }}
        >
          <ThemedText type="smallBold" style={{ color: "#c78a00" }}>
            Waiting for admin approval
          </ThemedText>
          <Detail label="Full name" value={latest.fullName} />
          <Detail label="Email" value={latest.email} />
          <Detail label="Room number" value={latest.unitNo} />
          <Detail label="Sent" value={formatDate(latest.requestedAt)} />
        </ThemedView>
        <ThemedText themeColor="textSecondary">
          You will become a tenant once an admin approves this. Check back here
          any time.
        </ThemedText>
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <View style={{ flex: 1 }}>
            <AppButton title="Close" variant="outline" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Check again"
              onPress={() => {
                fetchLatest(true);
                refreshProfile();
              }}
            />
          </View>
        </View>
      </View>
    );
  } else if (latest?.status === "approved") {
    // The role flips to tenant as soon as the profile refresh lands.
    content = (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">You are approved</ThemedText>
        <ThemedText themeColor="textSecondary">
          You are now a tenant. Your account is being updated.
        </ThemedText>
        <AppButton title="Done" onPress={onClose} />
      </View>
    );
  } else {
    content = (
      <View style={{ gap: Spacing.three }}>
        <ThemedText type="subtitle">Become a tenant</ThemedText>
        <ThemedText themeColor="textSecondary">
          Fill this in and an admin will review it. You keep your visitor
          account until it is approved.
        </ThemedText>

        {latest?.status === "rejected" && (
          <ThemedView
            type="backgroundElement"
            style={{
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: "#d64545",
              padding: Spacing.three,
              gap: Spacing.two,
            }}
          >
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

        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={saving}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Send request"
              onPress={submit}
              disabled={!valid}
              loading={saving}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.3)",
      }}
    >
      <View
        style={{
          backgroundColor: theme.background,
          borderTopLeftRadius: Spacing.four,
          borderTopRightRadius: Spacing.four,
          maxHeight: "90%",
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: Spacing.four }}
        >
          {content}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
