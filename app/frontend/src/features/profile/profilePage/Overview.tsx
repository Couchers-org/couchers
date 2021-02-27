import { Card, makeStyles, Typography } from "@material-ui/core";
import React from "react";

import Avatar from "../../../components/Avatar";
import BarWithHelp from "../../../components/Bar/BarWithHelp";
import Divider from "../../../components/Divider";
import { CouchIcon, LocationIcon } from "../../../components/Icons";
import IconText from "../../../components/IconText";
import LabelAndText from "../../../components/LabelAndText";
import { HostingStatus, MeetupStatus, User } from "../../../pb/api_pb";
import { timestamp2Date } from "../../../utils/date";
import { timeAgo } from "../../../utils/timeAgo";
import {
  COMMUNITY_STANDING,
  COMMUNITY_STANDING_DESCRIPTION,
  LAST_ACTIVE,
  REFERENCES,
  VERIFICATION_SCORE,
  VERIFICATION_SCORE_DESCRIPTION,
} from "../../constants";
import { hostingStatusLabels, meetupStatusLabels } from "../constants";

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    width: "25%",
    [theme.breakpoints.down("md")]: {
      marginBottom: theme.spacing(1),
      width: "100%",
    },
  },
  grow: {
    paddingTop: "100%",
  },
  info: {
    marginTop: theme.spacing(0.5),
  },
}));

interface OverviewProps {
  user: User.AsObject;
}

export default function Overview({ user }: OverviewProps) {
  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <Avatar {...{ user }} className={classes.grow} />
      <Typography variant="h1">{user.name}</Typography>
      <Typography variant="body1">{user.city}</Typography>
      <Divider />
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
