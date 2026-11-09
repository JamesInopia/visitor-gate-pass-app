import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { GatepassRequest } from "@/data/requests";
import { useTheme } from "@/hooks/use-theme";
import { describe } from "@/lib/gatepass-time";

export function RequestHeaderRow() {
  const theme = useTheme();
  return (
    <View
      style={[styles.row, styles.headerRow, { borderColor: theme.textSecondary }]}
    >
      <ThemedText type="smallBold" style={styles.nameCol}>
        Request Sent to:
      </ThemedText>
      <ThemedText type="smallBold" style={styles.statusCol}>
        Status
      </ThemedText>
    </View>
  );
}

export function RequestRow({
  request,
  now,
}: {
  request: GatepassRequest;
  now: Date;
}) {
  const theme = useTheme();
  const router = useRouter();
  const d = describe(request, now);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/my-gatepass/${request.id}`)}
      style={({ pressed }) => [
        styles.row,
        styles.card,
        {
          borderColor: theme.textSecondary,
          backgroundColor: pressed ? theme.backgroundSelected : theme.background,
        },
      ]}
    >
      <View style={styles.nameCol}>
        <ThemedText type="smallBold">{request.hostName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {request.unitNo ? `Unit ${request.unitNo} · ` : ""}
          {d.detail}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {d.schedule}
        </ThemedText>
      </View>
      <View style={styles.statusCol}>
        <StatusBadge phase={d.phase} label={d.badge} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  headerRow: { paddingHorizontal: Spacing.three },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  nameCol: { flex: 3 },
  statusCol: { flex: 2, alignItems: "flex-start" },
});
