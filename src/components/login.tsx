import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

const COPY: Record<Mode, { heading: string; action: string }> = {
  login: { heading: "Log in", action: "Log in" },
  signup: { heading: "Create an account", action: "Sign up" },
  forgot: { heading: "Reset your password", action: "Send reset link" },
};

export function Login() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  const valid = email.includes("@") && (mode === "forgot" || password.length >= 6);

  function switchTo(next: Mode) {
    setMode(next);
    setProblem("");
    setNotice("");
  }

  async function submit() {
    setBusy(true);
    setProblem("");
    setNotice("");
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setProblem(error.message);
      else setNotice("Check your email for a password reset link.");
    } else {
      const { data, error } =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (error) setProblem(error.message);
      else if (mode === "signup" && !data.session) setNotice("Check your email to confirm your account.");
    }
    setBusy(false);
  }

  const input = [styles.input, { color: theme.text, borderColor: theme.textSecondary }];

  return (
    <ThemedView style={styles.screen}>
      <ThemedText type="title">Gatepass</ThemedText>
      <ThemedText themeColor="textSecondary">{COPY[mode].heading}</ThemedText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!busy}
        style={input}
      />
      {mode !== "forgot" && (
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password, 6 or more characters"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          editable={!busy}
          style={input}
        />
      )}
      {problem !== "" && <ThemedText>{problem}</ThemedText>}
      {notice !== "" && <ThemedText themeColor="textSecondary">{notice}</ThemedText>}
      <Button title={busy ? "Please wait" : COPY[mode].action} onPress={submit} disabled={!valid || busy} />
      {mode === "login" && (
        <>
          <Button title="Create an account" onPress={() => switchTo("signup")} disabled={busy} />
          <Button title="Forgot password?" onPress={() => switchTo("forgot")} disabled={busy} />
        </>
      )}
      {mode !== "login" && <Button title="Back to log in" onPress={() => switchTo("login")} disabled={busy} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: Spacing.four, gap: Spacing.three },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three },
});
