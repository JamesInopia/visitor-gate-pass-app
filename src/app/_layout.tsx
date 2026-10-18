import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { Button, ActivityIndicator, useColorScheme } from "react-native";

import AppTabs from "@/components/app-tabs";
import { Login } from "@/components/login";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ProfileProvider } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const session = useSession();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {session === undefined && <ActivityIndicator style={{ flex: 1 }} />}
      {session === null && <Login />}
      {session && (
        <ProfileProvider key={session.user.id}>
          {(state) => {
            if (state.status === "loading") return <ActivityIndicator style={{ flex: 1 }} />;
            if (state.status === "error")
              return (
                <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
                  <ThemedText>Could not load your account. Is the API running?</ThemedText>
                  <Button title="Try again" onPress={state.retry} />
                  <Button title="Log out" onPress={() => supabase.auth.signOut()} />
                </ThemedView>
              );
            return <AppTabs />;
          }}
        </ProfileProvider>
      )}
    </ThemeProvider>
  );
}
