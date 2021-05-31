import { Card, CardActions, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Button from "components/Button";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import { useAuthContext } from "features/auth/AuthProvider";
import { CONNECTIONS } from "features/connections/constants";
import {
  COMMUNITY_STANDING,
  COMMUNITY_STANDING_DESCRIPTION,
  EDIT,
  REQUEST,
  VERIFICATION_SCORE,
  VERIFICATION_SCORE_DESCRIPTION,
} from "features/constants";
import FriendActions from "features/profile/actions/FriendActions";
import ProfileActionsMenuButton from "features/profile/actions/ProfileActionsMenuButton";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { LabelsReferencesLastActive } from "features/user/UserTextAndLabel";
import { HostingStatus, MeetupStatus, User } from "pb/api_pb";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  connectionsRoute,
  EditUserTab,
  routeToEditUser,
  UserTab,
} from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  card: {
    flexShrink: 0,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(1),
      width: "100%",
    },
    boxShadow: "1px 1px 8px rgba(0, 0, 0, 0.25)"
  },

  cardActions: {
    flexWrap: "wrap",
    justifyContent: "center",
    padding: theme.spacing(0.5),
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },

  info: {
    marginTop: theme.spacing(1),
  },

  intro: {
    display: "flex",
    justifyContent: "center",
  },

  marginBottom2: {
    marginBottom: theme.spacing(2),
  },

  marginBottom3: {
    marginBottom: theme.spacing(3),
  },

  wrapper: {
    marginTop: theme.spacing(2),
    "& h1": {
      textAlign: "center",
      marginBottom: theme.spacing(0.5),
    },
  },

  bar: {
    marginBottom: theme.spacing(2),
  },
}));

interface OverviewProps {
  user: User.AsObject;
  setIsRequesting: (value: boolean) => void;
}

const getEditTab = (tab: UserTab): EditUserTab | undefined => {
  switch (tab) {
    case "about":
    case "home":
      return tab;
    default:
      return undefined;
  }
};

export default function Overview({ user, setIsRequesting }: OverviewProps) {
  const classes = useStyles();
  const currentUserId = useAuthContext().authState.userId;
  const [mutationError, setMutationError] = useState("");

  const { tab } = useParams<{ tab: UserTab }>();

  return (
    <Card className={classes.card}>
      <Avatar user={user} grow />
      <div className={classes.wrapper}>
        <Typography variant="h1" className={classes.intro}>
          {user.name}
        </Typography>
        <Typography variant="body1" className={classes.intro}>
          {user.city}
        </Typography>
      </div>
      <Divider />
      {mutationError && <Alert severity="error">{mutationError}</Alert>}
      <CardActions className={classes.cardActions}>
        {user.userId === currentUserId ? (
          <>
            <Button
              component={Link}
              to={routeToEditUser(getEditTab(tab))}
              color="secondary"
            >
              {EDIT}
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
      <Divider className={classes.marginBottom3} />
      <BarWithHelp
        value={user.communityStanding || 0}
        label={COMMUNITY_STANDING}
        description={COMMUNITY_STANDING_DESCRIPTION}
        className={classes.marginBottom2}
      />
      <BarWithHelp
        value={user.verification || 0}
        label={VERIFICATION_SCORE}
        description={VERIFICATION_SCORE_DESCRIPTION}
        className={classes.marginBottom2}
      />
      <div className={classes.info}>
        <LabelsReferencesLastActive user={user} />
      </div>
    </Card>
  );
}
