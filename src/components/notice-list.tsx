import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppButton } from "@/components/app-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useNotices } from "@/hooks/use-notices";
import { formatVisitDate } from "@/lib/visit-date";

/** Cards telling a visitor their request was denied. Renders nothing if there are none. */
export function NoticeList({ style }: { style?: StyleProp<ViewStyle> }) {
  const { notices, dismiss } = useNotices();
  if (notices.length === 0) return null;

  return (
    <View style={[styles.list, style]}>
      {notices.map((n) => (
        <ThemedView key={n.id} type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold" style={{ color: "#d64545" }}>
            Request denied
          </ThemedText>
          <ThemedText>
            {n.hostName} denied your request
            {n.visitDate
              ? ` to visit on ${formatVisitDate(n.visitDate)}`
              : ""}
            . You can send a new request to someone else.
          </ThemedText>
          <AppButton
            title="Got it"
            variant="outline"
            onPress={() => dismiss(n.id)}
          />
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#d64545",
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
