import { PagePlaceholder } from "@/components/page-placeholder";
import { RoleGuard } from "@/components/role-guard";

export default function ScanGatepassScreen() {
  return (
    <RoleGuard route="scan-gatepass">
      <PagePlaceholder title="Scan Gatepass" />
    </RoleGuard>
  );
}
