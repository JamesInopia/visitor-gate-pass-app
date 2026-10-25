import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

export function AppHeader({ title }: { title: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top,
          backgroundColor: theme.background,
          borderBottomColor: theme.backgroundSelected,
        },
      ]}
    >
      <Pressable
        accessibilityLabel="Menu"
        hitSlop={12}
        onPress={() => setMenuOpen(true)}
        style={styles.button}
      >
        <Ionicons name="menu" size={26} color={theme.text} />
      </Pressable>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      <Pressable
        accessibilityLabel="Help"
        hitSlop={12}
        onPress={() => {}}
        style={styles.button}
      >
        <Ionicons name="help-circle-outline" size={26} color={theme.text} />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                top: insets.top + 48,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          >
            <View style={styles.who}>
              <ThemedText type="smallBold">{profile.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {profile.email}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Role: {profile.role}
              </ThemedText>
            </View>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.backgroundSelected },
              ]}
            />
            <Pressable
              accessibilityLabel="Sign out"
              onPress={signOut}
              style={styles.item}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.text} />
              <ThemedText>Sign out</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: { padding: Spacing.one },
  title: { fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  menu: {
    position: "absolute",
    left: Spacing.three,
    minWidth: 220,
    borderRadius: 12,
    paddingVertical: Spacing.two,
  },
  who: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
