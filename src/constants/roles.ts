import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type Role = "visitor" | "tenant" | "admin";

export type TabRoute =
  | "index"
  | "my-gatepass"
  | "visit-history"
  | "manage-gatepass"
  | "scan-gatepass"
  | "entry-log";

export const TABS: {
  route: TabRoute;
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[] = [
  { route: "index", title: "Home", icon: "home" },
  { route: "my-gatepass", title: "My Gatepass", icon: "ticket" },
  { route: "visit-history", title: "History", icon: "time" },
  { route: "manage-gatepass", title: "Manage Gatepass", icon: "list" },
  { route: "scan-gatepass", title: "Scan Gatepass", icon: "qr-code" },
  { route: "entry-log", title: "Entry Log", icon: "reader" },
];

export const ROLE_ROUTES: Record<Role, TabRoute[]> = {
  visitor: ["index", "my-gatepass", "visit-history"],
  tenant: ["index", "manage-gatepass"],
  admin: ["index", "scan-gatepass", "entry-log"],
};

export const canAccess = (role: Role | undefined, route: TabRoute) =>
  !!role && ROLE_ROUTES[role].includes(route);
