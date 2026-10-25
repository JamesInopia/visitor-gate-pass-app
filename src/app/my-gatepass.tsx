import { PagePlaceholder } from "@/components/page-placeholder";
import { RoleGuard } from "@/components/role-guard";

export default function MyGatepassScreen() {
  return (
    <RoleGuard route="my-gatepass">
      <PagePlaceholder title="My Gatepass" />
    </RoleGuard>
  );
}
