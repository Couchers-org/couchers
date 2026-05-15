import { TabPanel } from "@mui/lab";
import { Button, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import UserCard from "features/profile/view/UserCard";
import UserOverview from "features/profile/view/UserOverview";
import { StyledProfileRoot } from "features/profile/view/UserPage";
import { useTranslation } from "i18n";
import { GLOBAL, MOD } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserDetails } from "proto/admin_pb";
import { adminPanelUserLink, routeToModUser, UserTab } from "routes";

import useUserWithDetails from "./hooks";
import ModPanel from "./ModPanel";
import { ModUserDetails } from "./useModUserDetails";

const StyledBanDelBanner = styled("h1")(({ theme }) => ({
  marginBottom: "0",
  color: "red",
  textAlign: "center",
  textTransform: "uppercase",
}));

function AdminActions({ username }: { username: string }) {
  const { t } = useTranslation([GLOBAL, MOD]);
  return (
    <>
      <Button
        component={Link}
        variant="outlined"
        href={adminPanelUserLink(username)}
      >
        {t("mod:actions.open_in_console")}
      </Button>
    </>
  );
}

function BanDeleteBanner({
  userDetails,
}: {
  userDetails: UserDetails.AsObject;
}) {
  const { t } = useTranslation(MOD);
  let status = "";
  if (userDetails.banned || userDetails.deleted) {
    status =
      " " +
      [
        userDetails.deleted && t("mod:deleted"),
        userDetails.banned && t("mod:banned"),
      ]
        .filter(Boolean)
        .join(" + ");
  }

  return (
    <StyledBanDelBanner>
      {status ? `☠️ ${status} ☠️` : t("mod:title")}
    </StyledBanDelBanner>
  );
}

export default function ModUserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const router = useRouter();

  const { user, profile, userDetails, isLoading, error } =
    useUserWithDetails(username);

  return (
    <>
      <HtmlMeta title={user?.name} />
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : user && profile && userDetails ? (
        <ModUserDetails userDetails={userDetails}>
          <ProfileUserProvider user={user} profile={profile}>
            <BanDeleteBanner userDetails={userDetails} />
            <StyledProfileRoot>
              <UserOverview
                showHostAndMeetAvailability
                actions={<AdminActions username={user.username} />}
              />
              <UserCard
                tab={tab}
                modPanel={
                  <TabPanel value="mod">
                    <ModPanel user={user} userDetails={userDetails} />
                  </TabPanel>
                }
                onTabChange={(newTab) => {
                  router.push(
                    routeToModUser(user.username, newTab),
                    undefined,
                    {
                      scroll: false,
                    },
                  );
                }}
              />
            </StyledProfileRoot>
          </ProfileUserProvider>
        </ModUserDetails>
      ) : null}
    </>
  );
}
