import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  formatVisitDateLong,
  fromDateKey,
  MAX_DAYS_AHEAD,
  toDateKey,
} from "@/lib/visit-date";

type VisitDatePickerProps = {
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
};

export function VisitDatePicker({
  value,
  onChange,
  disabled = false,
}: VisitDatePickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + MAX_DAYS_AHEAD,
  );

  function pick(_event: unknown, date?: Date) {
    setOpen(false);
    if (date) onChange(toDateKey(date));
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose visit date"
        disabled={disabled}
        onPress={() => setOpen((o) => !o)}
        style={[
          styles.field,
          { borderColor: theme.textSecondary, opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <ThemedText
          style={{
            flex: 1,
            color: value ? theme.text : theme.textSecondary,
          }}
        >
          {value ? formatVisitDateLong(value) : "Select visit date"}
        </ThemedText>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {open && (
        <DateTimePicker
          value={value ? fromDateKey(value) : today}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={today}
          maximumDate={last}
          accentColor="#3c87f7"
          onValueChange={pick}
          onDismiss={() => setOpen(false)}
        />
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Up to {MAX_DAYS_AHEAD} days ahead.
      </ThemedText>
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
});
