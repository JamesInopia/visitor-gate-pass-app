import { Redirect } from "expo-router";
import type { ReactNode } from "react";

import { canAccess, type TabRoute } from "@/constants/roles";
import { useProfile } from "@/hooks/use-profile";

export function RoleGuard({
  route,
  children,
}: {
  route: TabRoute;
  children: ReactNode;
}) {
  const { role } = useProfile();
  if (!canAccess(role, route)) return <Redirect href="/" />;
  return <>{children}</>;
}
