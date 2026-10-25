import { Stack } from "expo-router";

import { RoleGuard } from "@/components/role-guard";

export default function MyGatepassLayout() {
  return (
    <RoleGuard route="my-gatepass">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
