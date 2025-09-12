import { styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useState } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import ProfileIncompleteDialog from "@/components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { doAntibot } from "@/features/antibot/antibot";
import { useAuthContext } from "@/features/auth/AuthProvider";
import useAccountInfo from "@/features/auth/useAccountInfo";
import FriendActions from "@/features/profile/actions/FriendActions";
import MessageUserButton from "@/features/profile/actions/MessageUserButton";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import UserOverview from "@/features/profile/view/UserOverview";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { HostingStatus } from "@/proto/api_pb";
import {
  CONNECTIONS_ROUTE,
  EditUserTab,
  UserTab,
  routeToEditProfile,
} from "@/routes";
import { theme } from "@/theme";

import AdminPanelUserButton from "./AdminPanelUserButton";
import ProfileReportFlagButton from "./ProfileReportFlagButton";

const StyledModButtons = styled("div")(() => ({
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

const LoggedInUserActions = ({ tab }: { tab: UserTab }) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  return (
    <>
      <Button
        component={Link}
        color="primary"
        href={routeToEditProfile(getEditTab(tab))}
      >
        {t("global:edit")}
      </Button>
      <Button
        component={Link}
        variant="outlined"
        sx={{
          color: theme.palette.common.black,
          borderColor: theme.palette.grey[300],

          "&:hover": {
            borderColor: theme.palette.grey[300],
            backgroundColor: "#3135390A",
          },
        }}
        href={CONNECTIONS_ROUTE}
      >
        {t("profile:my_connections")}
      </Button>
    </>
  );
};

const DefaultActions = ({
  setIsRequesting,
}: {
  setIsRequesting: (value: boolean) => void;
}) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const shouldDisableHosting =
    user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  const [mutationError, setMutationError] = useState("");
  const [shouldShowCantRequestDialog, setShouldShowCantRequestDialog] =
    useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  const requestButton = () => {
    void doAntibot("host_request");
    if (!accountInfo?.profileComplete) {
      setShouldShowCantRequestDialog(true);
    } else {
      setIsRequesting(true);
    }
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={shouldShowCantRequestDialog}
        onClose={() => {
          setShouldShowCantRequestDialog(false);
        }}
        attemptedAction="send_request"
      />
      <Button
        onClick={requestButton}
        disabled={isAccountInfoLoading || shouldDisableHosting}
      >
        {shouldDisableHosting
          ? t("global:hosting_status.cant_host")
          : t("profile:actions.request")}
      </Button>

      <MessageUserButton user={user} setMutationError={setMutationError} />
      <FriendActions user={user} setMutationError={setMutationError} />

      <StyledModButtons>
        <ProfileReportFlagButton
          contentRef={`profile/${user.userId}`}
          authorUser={user.userId}
          profileUser={user}
        />
        <AdminPanelUserButton username={user.username} />
      </StyledModButtons>

      {mutationError && <Alert severity="error">{mutationError}</Alert>}
    </>
  );
};

export interface OverviewProps {
  setIsRequesting: (value: boolean) => void;
  tab: UserTab;
}

export const Overview = ({ setIsRequesting, tab }: OverviewProps) => {
  const currentUserId = useAuthContext().authState.userId;
  const user = useProfileUser();

  return (
    <UserOverview
      showHostAndMeetAvailability
      actions={
        user.userId === currentUserId ? (
          <LoggedInUserActions tab={tab} />
        ) : (
          <DefaultActions setIsRequesting={setIsRequesting} />
        )
      }
    />
  );
};
