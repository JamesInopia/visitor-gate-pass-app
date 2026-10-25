import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <ThemedView style={styles.screen}>
      <ThemedText type="subtitle">{title}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center" },
});
