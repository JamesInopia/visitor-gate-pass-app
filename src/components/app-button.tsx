import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Brand, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "brand";
  icon?: ComponentProps<typeof Ionicons>["name"];
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
};

const BLUE = "#3c87f7";
const RED = "#d64545";

export function AppButton({
  title,
  onPress,
  variant = "primary",
  icon,
  style,
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const brand = variant === "brand";

  const color =
    variant === "primary" || brand
      ? "#ffffff"
      : variant === "danger"
        ? RED
        : theme.text;
  const border = brand
    ? Brand.blue
    : variant === "primary"
      ? BLUE
      : variant === "danger"
        ? RED
        : theme.text;
  const bg = brand ? Brand.blue : variant === "primary" ? BLUE : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        brand && styles.brand,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: inactive ? 0.5 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={color} />}
          <ThemedText
            type="smallBold"
            style={{ color, fontSize: brand ? 16 : 14 }}
          >
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  brand: {
    borderRadius: 6,
    minHeight: 48,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
