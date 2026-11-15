import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type Role = "visitor" | "tenant" | "admin";

export type TabRoute =
  | "index"
  | "my-gatepass"
  | "visit-history"
  | "manage-gatepass"
  | "manage-history"
  | "scan-gatepass"
  | "entry-log";

export const TABS: {
  route: TabRoute;
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { route: "index", title: "Home", icon: "home-outline" },
  { route: "my-gatepass", title: "My Gatepass", icon: "ticket-outline" },
  { route: "visit-history", title: "History", icon: "time-outline" },
  { route: "manage-gatepass", title: "Manage Requests", icon: "ticket-outline" },
  { route: "manage-history", title: "History", icon: "time-outline" },
  { route: "scan-gatepass", title: "Scan Gatepass", icon: "qr-code-outline" },
  { route: "entry-log", title: "Visitor Log", icon: "log-in-outline" },
];

export const ROLE_ROUTES: Record<Role, TabRoute[]> = {
  visitor: ["index", "my-gatepass", "visit-history"],
  tenant: ["index", "manage-gatepass", "manage-history"],
  admin: ["index", "scan-gatepass", "entry-log"],
};

export const canAccess = (role: Role | undefined, route: TabRoute) =>
  !!role && ROLE_ROUTES[role].includes(route);
