import { Box, Card, CardActions, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import {
  COMMUNITY_STANDING,
  COMMUNITY_STANDING_DESCRIPTION,
  hostingStatusLabels,
  meetupStatusLabels,
  VERIFICATION_SCORE,
  VERIFICATION_SCORE_DESCRIPTION,
} from "features/profile/constants";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import React, { PropsWithChildren } from "react";
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";
import { ReferencesLastActiveLabels, ResponseRateLabel } from "./userLabels";

const useStyles = makeStyles((theme) => ({
  card: {
    flexShrink: 0,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      marginBottom: theme.spacing(1),
      width: "100%",
    },
  },

  info: {
    marginTop: theme.spacing(0.5),
  },

  intro: {
    display: "flex",
    justifyContent: "center",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },

  wrapper: {
    marginTop: theme.spacing(2),
    "& h1": {
      textAlign: "center",
      marginBottom: theme.spacing(0.5),
    },
  },

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
}));

// @todo: move this into /components and decouple it from features/profile because it's used
//        from the dashboard as well
export default function UserOverview({
  actions,
  showHostAndMeetAvailability = true,
}: PropsWithChildren<{
  actions?: React.ReactNode;
  showHostAndMeetAvailability?: boolean;
}>) {
  const classes = useStyles();
  const user = useProfileUser();

  return (
    <Card className={classes.card}>
      <Box maxWidth="75%" mx="auto">
        <Avatar user={user} grow />
      </Box>

      <div className={classes.wrapper}>
        <Typography variant="h1" className={classes.intro}>
          {user.name}
        </Typography>
        <Typography variant="body1" className={classes.intro}>
          {user.city}
        </Typography>
      </div>

      <Divider />

      {actions && (
        <CardActions className={classes.cardActions}>{actions}</CardActions>
      )}

      {showHostAndMeetAvailability && (
        <>
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
        </>
      )}

      {Boolean(showHostAndMeetAvailability || actions) && (
        <Divider spacing={3} />
      )}

      {process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED && (
        <>
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
        </>
      )}
      <div className={classes.info}>
        <ReferencesLastActiveLabels user={user} />
        <ResponseRateLabel user={user} />
      </div>
    </Card>
  );
}
