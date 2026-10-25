import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { Phase } from "@/lib/gatepass-time";

const DOT: Record<Phase, string> = {
  pending: "#f5c400",
  upcoming: "#3c87f7",
  active: "#2e9e5b",
  denied: "#d64545",
  expired: "#9aa0a6",
};

export function StatusBadge({ phase, label }: { phase: Phase; label: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: DOT[phase] }]} />
      <ThemedText type="small">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
