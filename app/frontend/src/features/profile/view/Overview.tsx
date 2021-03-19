import { Card, CardActions, makeStyles, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Button from "components/Button";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import LabelAndText from "components/LabelAndText";
import { useAuthContext } from "features/auth/AuthProvider";
import AddFriendButton from "features/connections/friends/AddFriendButton";
import {
  COMMUNITY_STANDING,
  COMMUNITY_STANDING_DESCRIPTION,
  EDIT_HOME,
  EDIT_PROFILE,
  LAST_ACTIVE,
  REFERENCES,
  VERIFICATION_SCORE,
  VERIFICATION_SCORE_DESCRIPTION,
} from "features/constants";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { HostingStatus, MeetupStatus, User } from "pb/api_pb";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { editHostingPreferenceRoute, editProfileRoute } from "routes";
import { timestamp2Date } from "utils/date";
import { timeAgo } from "utils/timeAgo";

import ProfileActionsMenuButton from "../actions/ProfileActionsMenuButton";

const useStyles = makeStyles((theme) => ({
  card: {
    flexShrink: 0,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    width: "25%",
    [theme.breakpoints.down("md")]: {
      marginBottom: theme.spacing(2),
    },
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      marginBottom: theme.spacing(1),
      width: "100%",
    },
  },
  cardActions: {
    justifyContent: "center",
    paddingLeft: 0,
    paddingRight: 0,
  },
  grow: {
    paddingTop: "100%",
  },
  info: {
    marginTop: theme.spacing(0.5),
  },
  intro: {
    display: "flex",
    justifyContent: "center",
  },
}));

interface OverviewProps {
  user: User.AsObject;
}

export default function Overview({ user }: OverviewProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const [mutationError, setMutationError] = useState("");

  return (
    <Card className={classes.card}>
      <Avatar user={user} className={classes.grow} />
      <Typography variant="h1" className={classes.intro}>
        {user.name}
      </Typography>
      <Typography variant="body1" className={classes.intro}>
        {user.city}
      </Typography>
      <Divider />
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
          </>
        ) : (
          <>
            {user.friends !== User.FriendshipStatus.FRIENDS && (
              <AddFriendButton
                isPending={user.friends === User.FriendshipStatus.PENDING}
                userId={user.userId}
                setMutationError={setMutationError}
              />
            )}
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
      <BarWithHelp
        value={user.communityStanding || 0}
        label={COMMUNITY_STANDING}
        description={COMMUNITY_STANDING_DESCRIPTION}
      />
      <BarWithHelp
        value={user.verification || 0}
        label={VERIFICATION_SCORE}
        description={VERIFICATION_SCORE_DESCRIPTION}
      />
      <div className={classes.info}>
        <LabelAndText label={REFERENCES} text={`${user.numReferences || 0}`} />
        <LabelAndText
          label={LAST_ACTIVE}
          text={
            user.lastActive
              ? `${timeAgo(timestamp2Date(user.lastActive))}`
              : "Unknown"
          }
        />
      </div>
    </Card>
  );
}
