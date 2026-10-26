import { ScrollView, StyleSheet } from "react-native";

import {
  GatepassStatusCard,
  IncomingRequestsCard,
  ProfileCard,
  UpcomingGatepassCard,
} from "@/components/home-cards";
import { NoticeList } from "@/components/notice-list";
import { RoleGuard } from "@/components/role-guard";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";

function Home() {
  const profile = useProfile();
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      <ProfileCard profile={profile} />
      {profile.role === "visitor" && (
        <>
          <NoticeList />
          <GatepassStatusCard />
        </>
      )}
      {profile.role === "tenant" && <IncomingRequestsCard />}
      {profile.role === "tenant" && <UpcomingGatepassCard />}
    </ScrollView>
  );
}

export default function HomeScreen() {
  return (
    <RoleGuard route="index">
      <Home />
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
});
