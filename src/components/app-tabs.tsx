import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { canAccess, TABS } from "@/constants/roles";
import { Brand, Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

function BrandTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { role } = useProfile();

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.route === route.name);
        if (!tab || !canAccess(role, tab.route)) return null;

        const focused = state.index === index;
        const color = focused ? "#000000" : "#ffffff";

        const onPress = () => {
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={[
              styles.tab,
              { backgroundColor: focused ? "#ffffff" : Brand.blue },
            ]}
          >
            <Ionicons name={tab.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs tabBar={(props) => <BrandTabBar {...props} />}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.route}
          name={tab.route}
          options={{
            title: tab.title,
            header: () => <AppHeader />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    backgroundColor: Brand.navy,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  label: { fontSize: 11, fontWeight: "500" },
});
