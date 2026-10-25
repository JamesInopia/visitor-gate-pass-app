import { Stack } from "expo-router";

import { RoleGuard } from "@/components/role-guard";

export default function ManageGatepassLayout() {
  return (
    <RoleGuard route="manage-gatepass">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
