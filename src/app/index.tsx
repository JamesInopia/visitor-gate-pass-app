import { PagePlaceholder } from "@/components/page-placeholder";
import { RoleGuard } from "@/components/role-guard";

export default function HomeScreen() {
  return (
    <RoleGuard route="index">
      <PagePlaceholder title="Home" />
    </RoleGuard>
  );
}
