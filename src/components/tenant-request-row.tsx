import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { GatepassRequest } from "@/data/requests";
import { useTheme } from "@/hooks/use-theme";
import { describeForTenant } from "@/lib/gatepass-time";

export function TenantHeaderRow() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        styles.headerRow,
        { borderColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="smallBold" style={{ flex: 1 }}>
        Request sent from:
      </ThemedText>
      <ThemedText type="smallBold">Status:</ThemedText>
    </View>
  );
}

export function TenantRequestRow({
  request,
  now,
}: {
  request: GatepassRequest;
  now: Date;
}) {
  const theme = useTheme();
  const router = useRouter();
  const d = describeForTenant(request, now);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/manage-gatepass/${request.id}`)}
      style={({ pressed }) => [
        styles.row,
        styles.card,
        {
          backgroundColor: pressed ? theme.backgroundSelected : theme.background,
        },
      ]}
    >
      <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
        {request.visitorName}
      </ThemedText>
      <StatusBadge phase={d.phase} label={d.badge} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  headerRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
