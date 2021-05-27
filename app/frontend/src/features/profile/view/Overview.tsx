import { CardActions } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import { useAuthContext } from "features/auth/AuthProvider";
import { CONNECTIONS } from "features/connections/constants";
import { EDIT_HOME, EDIT_PROFILE, REQUEST } from "features/constants";
import FriendActions from "features/profile/actions/FriendActions";
import ProfileActionsMenuButton from "features/profile/actions/ProfileActionsMenuButton";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import UserOverview from "features/profile/view/UserOverview";
import { HostingStatus, MeetupStatus, User } from "pb/api_pb";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  connectionsRoute,
  editHostingPreferenceRoute,
  editProfileRoute,
} from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  cardActions: {
    flexWrap: "wrap",
    justifyContent: "center",
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    "& > *": {
      marginBlockStart: theme.spacing(1),
    },
  },
}));

export interface OverviewProps {
  user: User.AsObject;
  setIsRequesting: (value: boolean) => void;
}

export default function Overview({ user, setIsRequesting }: OverviewProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const [mutationError, setMutationError] = useState("");

  return (
    <UserOverview user={user}>
      {mutationError && <Alert severity="error">{mutationError}</Alert>}
      <CardActions className={classes.cardActions}>
        {user.userId === currentUserId ? (
          <>
            <Button component={Link} to={editProfileRoute}>
              {EDIT_PROFILE}
            </Button>
            <Button component={Link} to={editHostingPreferenceRoute}>
              {EDIT_HOME}
            </Button>
            <Button component={Link} to={connectionsRoute}>
              {CONNECTIONS}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsRequesting(true)}>{REQUEST}</Button>
            <FriendActions user={user} setMutationError={setMutationError} />
            <ProfileActionsMenuButton />
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
      <Divider />
    </UserOverview>
  );
}
