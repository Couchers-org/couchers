import Alert from "components/Alert";
import Button from "components/Button";
import { useAuthContext } from "features/auth/AuthProvider";
import FlagButton from "features/FlagButton";
import FriendActions from "features/profile/actions/FriendActions";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import { EDIT, NOT_ACCEPTING, REQUEST } from "features/profile/constants";
import UserOverview from "features/profile/view/UserOverview";
import { PROFILE } from "i18n/namespaces";
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
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";

const useStyles = makeStyles((theme) => ({
  flagButton: {
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
  const { t } = useTranslation([PROFILE]);
  return (
    <>
      <Link href={routeToEditProfile(getEditTab(tab))} passHref>
        <Button component="a" color="secondary">
          {EDIT}
        </Button>
      </Link>
      <Link href={connectionsRoute} passHref>
        <Button component="a">{t("profile:my_connections")}</Button>
      </Link>
    </>
  );
}

function DefaultActions({
  setIsRequesting,
}: {
  setIsRequesting: (value: boolean) => void;
}) {
  const classes = useStyles();
  const user = useProfileUser();
  const disableHosting =
    user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  const [mutationError, setMutationError] = useState("");

  return (
    <>
      <Button onClick={() => setIsRequesting(true)} disabled={disableHosting}>
        {disableHosting ? NOT_ACCEPTING : REQUEST}
      </Button>

      <MessageUserButton user={user} setMutationError={setMutationError} />
      <FriendActions user={user} setMutationError={setMutationError} />

      <FlagButton
        className={classes.flagButton}
        contentRef={`profile/${user.userId}`}
        authorUser={user.userId}
      />

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
