import Alert from "components/Alert";
import Button from "components/Button";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import FlagButton from "features/FlagButton";
import FriendActions from "features/profile/actions/FriendActions";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import UserOverview from "features/profile/view/UserOverview";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { HostingStatus } from "proto/api_pb";
import { useState } from "react";
import {
  connectionsRoute,
  EditUserTab,
  routeToEditProfile,
  UserTab,
} from "routes";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";
import AdminPanelUserButton from "./AdminPanelUserButton";

const useStyles = makeStyles((theme) => ({
  modButtons: {
    alignSelf: "center",
  },
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

function LoggedInUserActions({ tab }: { tab: UserTab }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  return (
    <>
      <Link href={routeToEditProfile(getEditTab(tab))} passHref>
        <Button component="a" color="primary">
          {t("global:edit")}
        </Button>
      </Link>
      <Link href={connectionsRoute} passHref>
        <Button
          component="a"
          variant="outlined"
          sx={{
            color: theme.palette.common.black,
            borderColor: theme.palette.grey[300],

            "&:hover": {
              borderColor: theme.palette.grey[300],
              backgroundColor: "#3135390A",
            },
          }}
        >
          {t("profile:my_connections")}
        </Button>
      </Link>
    </>
  );
}

function DefaultActions({
  setIsRequesting,
}: {
  setIsRequesting: (value: boolean) => void;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useStyles();
  const user = useProfileUser();
  const disableHosting =
    user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  const [mutationError, setMutationError] = useState("");
  const [showCantRequestDialog, setShowCantRequestDialog] =
    useState<boolean>(false);

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  const requestButton = () => {
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
      <Button
        onClick={requestButton}
        disabled={isAccountInfoLoading || disableHosting}
      >
        {disableHosting
          ? t("global:hosting_status.cant_host")
          : t("profile:actions.request")}
      </Button>

      <MessageUserButton user={user} setMutationError={setMutationError} />
      <FriendActions user={user} setMutationError={setMutationError} />

      <div className={classes.modButtons}>
        <FlagButton
          contentRef={`profile/${user.userId}`}
          authorUser={user.userId}
        />
        <AdminPanelUserButton username={user.username} />
      </div>

      {mutationError && <Alert severity="error">{mutationError}</Alert>}
    </>
  );
}

export interface OverviewProps {
  setIsRequesting: (value: boolean) => void;
  tab: UserTab;
}

export default function Overview({ setIsRequesting, tab }: OverviewProps) {
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
}
