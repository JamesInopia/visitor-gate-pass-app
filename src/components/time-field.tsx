import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMinutes, minutesOfDay } from "@/lib/visit-date";

type TimeFieldProps = {
  label: string;
  /** Minutes since midnight (0 - 1439). */
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
};

export function TimeField({
  label,
  value,
  onChange,
  disabled = false,
}: TimeFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const date = new Date(2000, 0, 1, Math.floor(value / 60), value % 60);

  function pick(_event: unknown, picked?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (picked) onChange(minutesOfDay(picked));
  }

  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small">{label}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} time`}
        disabled={disabled}
        onPress={() => setOpen((o) => !o)}
        style={[
          styles.field,
          { borderColor: theme.textSecondary, opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <ThemedText style={{ flex: 1 }}>{formatMinutes(value)}</ThemedText>
        <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
      </Pressable>

      {open && (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour={false}
          accentColor="#3c87f7"
          onValueChange={pick}
          onDismiss={() => setOpen(false)}
        />
      )}
      {open && Platform.OS === "ios" && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={styles.done}
        >
          <ThemedText type="smallBold" style={{ color: "#3c87f7" }}>
            Done
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  done: { alignSelf: "flex-end", paddingVertical: Spacing.one },
});
