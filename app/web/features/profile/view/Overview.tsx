import { CardActions } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import { useAuthContext } from "features/auth/AuthProvider";
import FlagButton from "features/FlagButton";
import FriendActions from "features/profile/actions/FriendActions";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import {
  EDIT,
  hostingStatusLabels,
  meetupStatusLabels,
  NOT_ACCEPTING,
  REQUEST,
} from "features/profile/constants";
import UserOverview from "features/profile/view/UserOverview";
import { PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
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
  cardActions: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    padding: theme.spacing(0.5),
    "& > *": {
      margin: theme.spacing(0.5),
    },
    "& > :not(:first-child)": {
      marginLeft: theme.spacing(0.5),
    },
  },
  flagButton: {
    alignSelf: "center",
  },

  marginBottom3: {
    marginBottom: theme.spacing(3),
  },
}));

export interface OverviewProps {
  setIsRequesting: (value: boolean) => void;
  tab: UserTab | undefined;
}

const getEditTab = (tab: UserTab | undefined): EditUserTab | undefined => {
  switch (tab) {
    case "about":
    case "home":
      return tab;
    default:
      return undefined;
  }
};

export default function Overview({ setIsRequesting, tab }: OverviewProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const [mutationError, setMutationError] = useState("");
  const user = useProfileUser();
  const { t } = useTranslation([PROFILE]);

  const disableHosting =
    user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST;

  return (
    <UserOverview>
      {mutationError && <Alert severity="error">{mutationError}</Alert>}
      <CardActions className={classes.cardActions}>
        {user.userId === currentUserId ? (
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
        ) : (
          <>
            <Button
              onClick={() => setIsRequesting(true)}
              disabled={disableHosting}
            >
              {disableHosting ? NOT_ACCEPTING : REQUEST}
            </Button>

            <MessageUserButton
              user={user}
              setMutationError={setMutationError}
            />
            <FriendActions user={user} setMutationError={setMutationError} />
            <FlagButton
              className={classes.flagButton}
              contentRef={`profile/${user.userId}`}
              authorUser={user.userId}
            />
          </>
        )}
      </CardActions>
      <IconText
        icon={CouchIcon}
        text={
          hostingStatusLabels[
            user.hostingStatus || HostingStatus.HOSTING_STATUS_UNKNOWN
          ]
        }
      />
      <IconText
        icon={LocationIcon}
        text={
          meetupStatusLabels[
            user.meetupStatus || MeetupStatus.MEETUP_STATUS_UNKNOWN
          ]
        }
      />
      <Divider className={classes.marginBottom3} />
    </UserOverview>
  );
}
