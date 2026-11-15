import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Brand, Spacing } from "@/constants/theme";
import type { Phase } from "@/lib/gatepass-time";

const DOT: Record<Phase, string> = {
  pending: Brand.yellow,
  upcoming: Brand.green,
  active: Brand.green,
  denied: Brand.red,
  cancelled: "#9aa0a6",
  expired: "#9aa0a6",
};

export function StatusBadge({ phase, label }: { phase: Phase; label: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <View style={[styles.dot, { backgroundColor: DOT[phase] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
