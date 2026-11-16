import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/app-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "reset";

const TITLE: Record<Mode, string> = {
  login: "Login",
  signup: "Sign up",
  reset: "Reset Password",
};

const LINK_BLUE = "#2f6fd6";

function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.backgroundSelected,
            backgroundColor: theme.background,
          },
        ]}
        {...props}
      />
    </View>
  );
}

function LinkText({
  before,
  link,
  onPress,
  disabled,
}: {
  before?: string;
  link: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <ThemedText type="small" style={styles.centered}>
      {before}
      <Text
        accessibilityRole="link"
        onPress={disabled ? undefined : onPress}
        style={{ color: LINK_BLUE }}
      >
        {link}
      </Text>
    </ThemedText>
  );
}

export function Login() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  const needsConfirm = mode !== "login";
  const mismatch = needsConfirm && confirm !== "" && confirm !== password;
  const valid =
    email.includes("@") &&
    password.length >= 6 &&
    (!needsConfirm || confirm === password) &&
    (mode !== "reset" || !codeSent || code.trim().length >= 6);

  function switchTo(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirm("");
    setCode("");
    setCodeSent(false);
    setProblem("");
    setNotice("");
  }

  // Android back button returns to the login form instead of closing the app.
  useEffect(() => {
    if (mode === "login") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      switchTo("login");
      return true;
    });
    return () => sub.remove();
  }, [mode]);

  async function submit() {
    setBusy(true);
    setProblem("");
    setNotice("");

    if (mode === "reset") {
      if (!codeSent) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setProblem(error.message);
        else {
          setCodeSent(true);
          setNotice("We emailed you a code. Enter it below to finish.");
        }
      } else {
        const verified = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "recovery",
        });
        if (verified.error) setProblem(verified.error.message);
        else {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) setProblem(error.message);
          // On success the session becomes active and the app opens.
        }
      }
    } else {
      const { data, error } =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (error) setProblem(error.message);
      else if (mode === "signup" && !data.session)
        setNotice("Check your email to confirm your account.");
    }
    setBusy(false);
  }

  const buttonTitle = busy
    ? "Please wait"
    : mode === "login"
      ? "Log In"
      : mode === "signup"
        ? "Sign Up"
        : codeSent
          ? "Confirm Reset"
          : "Reset Password";

  return (
    <ThemedView style={styles.screen}>
      {mode === "reset" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to login"
          hitSlop={12}
          disabled={busy}
          onPress={() => switchTo("login")}
          style={[styles.back, { top: insets.top + Spacing.two }]}
        >
          <Ionicons name="arrow-back" size={26} color={LINK_BLUE} />
          <Text style={{ color: LINK_BLUE, fontSize: 16 }}>Back</Text>
        </Pressable>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          mode === "reset" && { paddingTop: insets.top + 64 },
        ]}
      >
        <View style={mode === "reset" ? styles.formTop : styles.formCenter}>
          <ThemedText style={styles.title}>{TITLE[mode]}</ThemedText>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!busy && !codeSent}
          />
          <Field
            label={mode === "reset" ? "New Password" : "Password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!busy && !codeSent}
          />
          {needsConfirm && (
            <Field
              label={mode === "reset" ? "Confirm New Password" : "Confirm Password"}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              editable={!busy && !codeSent}
            />
          )}
          {mode === "reset" && codeSent && (
            <Field
              label="Code from email"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              editable={!busy}
            />
          )}

          {mismatch && <ThemedText type="small">Passwords do not match.</ThemedText>}
          {problem !== "" && <ThemedText type="small">{problem}</ThemedText>}
          {notice !== "" && (
            <ThemedText type="small" themeColor="textSecondary">
              {notice}
            </ThemedText>
          )}

          <AppButton
            variant="brand"
            title={buttonTitle}
            onPress={submit}
            disabled={!valid || busy}
            style={styles.submit}
          />

          {mode === "login" && (
            <View style={styles.links}>
              <LinkText
                before="Don't have an account? "
                link="Sign up"
                disabled={busy}
                onPress={() => switchTo("signup")}
              />
              <LinkText
                before="Forgot password? "
                link="Reset Password"
                disabled={busy}
                onPress={() => switchTo("reset")}
              />
            </View>
          )}
          {mode === "signup" && (
            <View style={styles.links}>
              <LinkText
                before="Already have an account? "
                link="Log In"
                disabled={busy}
                onPress={() => switchTo("login")}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.four },
  formCenter: { flexGrow: 1, justifyContent: "center", gap: Spacing.three },
  formTop: { gap: Spacing.four },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  submit: { alignSelf: "center", marginTop: Spacing.two },
  links: { gap: Spacing.two, alignItems: "center" },
  centered: { textAlign: "center" },
  back: {
    position: "absolute",
    left: Spacing.three,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});
