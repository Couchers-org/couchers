import { Edit, OpenInNew } from "@mui/icons-material";
import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { doAntibot } from "features/antibot/antibot";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import FriendActions from "features/profile/actions/FriendActions";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import UserOverview from "features/profile/view/UserOverview";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { HostingStatus } from "proto/api_pb";
import { useState } from "react";
import { connectionsRoute, EditUserTab, routeToEditProfile, routeToUser, UserTab } from "routes";

import { useProfileUser } from "../hooks/useProfileUser";
import AdminPanelUserButton from "./AdminPanelUserButton";
import ProfileReportFlagButton from "./ProfileReportFlagButton";

const StyledModButtons = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
}));

const getEditTab = (tab: UserTab): EditUserTab | undefined => {
  switch (tab) {
    case "about":
    case "home":
      return tab;
    default:
      return undefined;
  }
};

function LoggedInUserActions({ tab, isInSheet }: { tab: UserTab; isInSheet: boolean }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();

  if (isInSheet) {
    return (
      <Button
        component={Link}
        color="primary"
        href={routeToUser(user.username)}
        startIcon={<OpenInNew fontSize="small" />}
      >
        {t("profile:open_full_profile")}
      </Button>
    );
  }

  return (
    <>
      <Button
        component={Link}
        color="primary"
        href={routeToEditProfile(getEditTab(tab))}
        startIcon={<Edit fontSize="small" />}
      >
        {t("profile:edit")}
      </Button>
      <Button component={Link} variant="outlined" href={connectionsRoute}>
        {t("profile:my_connections")}
      </Button>
    </>
  );
}

function DefaultActions({
  setIsRequesting,
  setIsMessaging,
}: {
  setIsRequesting: (value: boolean) => void;
  setIsMessaging: (value: boolean) => void;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const disableHosting = user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  const [mutationError, setMutationError] = useState("");
  const [showCantRequestDialog, setShowCantRequestDialog] = useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } = useAccountInfo();

  const requestButton = () => {
    doAntibot("host_request");
    if (!accountInfo?.profileComplete) {
      setShowCantRequestDialog(true);
    } else {
      setIsRequesting(true);
    }
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={showCantRequestDialog}
        onClose={() => setShowCantRequestDialog(false)}
        attempted_action="send_request"
      />
      <Button onClick={requestButton} disabled={isAccountInfoLoading || disableHosting}>
        {disableHosting ? t("global:hosting_status.cant_host") : t("profile:actions.request")}
      </Button>

      <MessageUserButton user={user} setMutationError={setMutationError} setIsMessaging={setIsMessaging} />
      <FriendActions user={user} setMutationError={setMutationError} />

      <StyledModButtons>
        <ProfileReportFlagButton contentRef={`profile/${user.userId}`} authorUser={user.userId} profileUser={user} />
        <AdminPanelUserButton username={user.username} />
      </StyledModButtons>

      {mutationError && <Alert severity="error">{mutationError}</Alert>}
    </>
  );
}

interface OverviewProps {
  setIsRequesting?: (value: boolean) => void;
  setIsMessaging?: (value: boolean) => void;
  tab: UserTab;
  isInSheet?: boolean;
}

export default function Overview({ setIsRequesting, setIsMessaging, tab, isInSheet = false }: OverviewProps) {
  const currentUserId = useAuthContext().authState.userId;
  const user = useProfileUser();
  const isOwnProfile = user.userId === currentUserId;

  return (
    <UserOverview
      showHostAndMeetAvailability
      isOwnProfile={isOwnProfile}
      actions={
        isOwnProfile ? (
          <LoggedInUserActions tab={tab} isInSheet={isInSheet} />
        ) : (
          <DefaultActions
            setIsRequesting={setIsRequesting ?? (() => {})}
            setIsMessaging={setIsMessaging ?? (() => {})}
          />
        )
      }
    />
  );
}
