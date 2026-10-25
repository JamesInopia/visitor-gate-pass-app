import { PagePlaceholder } from "@/components/page-placeholder";
import { RoleGuard } from "@/components/role-guard";

export default function ManageGatepassScreen() {
  return (
    <RoleGuard route="manage-gatepass">
      <PagePlaceholder title="Manage Gatepass" />
    </RoleGuard>
  );
}
