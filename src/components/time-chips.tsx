import { useEffect, useRef, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMinutes } from "@/lib/visit-date";

const CHIP_WIDTH = 92;

type TimeChipsProps = {
  label: string;
  options: number[];
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
};

export function TimeChips({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: TimeChipsProps) {
  const theme = useTheme();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const index = options.indexOf(value);
    if (index > 0)
      scroller.current?.scrollTo({
        x: Math.max(0, index * (CHIP_WIDTH + Spacing.two) - CHIP_WIDTH),
        animated: false,
      });
  }, []);

  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="small">{label}</ThemedText>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.two }}
      >
        {options.map((m) => {
          const selected = m === value;
          return (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              disabled={disabled}
              onPress={() => onChange(m)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? "#3c87f7" : theme.textSecondary,
                  backgroundColor: selected ? "#3c87f7" : "transparent",
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: selected ? "#ffffff" : theme.text }}
              >
                {formatMinutes(m)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: CHIP_WIDTH,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
  },
});
