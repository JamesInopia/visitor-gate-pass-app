import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { AppHeader } from "@/components/app-header";
import { canAccess, TABS } from "@/constants/roles";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";

export default function AppTabs() {
  const { role } = useProfile();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3c87f7",
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.route}
          name={tab.route}
          options={{
            title: tab.title,
            href: canAccess(role, tab.route) ? undefined : null,
            header: () => <AppHeader title={tab.title} />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
