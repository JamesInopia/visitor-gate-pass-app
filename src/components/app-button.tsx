import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  loading?: boolean;
};

const BLUE = "#3c87f7";
const RED = "#d64545";

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const color =
    variant === "primary" ? "#ffffff" : variant === "danger" ? RED : theme.text;
  const border =
    variant === "primary" ? BLUE : variant === "danger" ? RED : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === "primary" ? BLUE : "transparent",
          borderColor: border,
          opacity: inactive ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <ThemedText type="smallBold" style={{ color }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
