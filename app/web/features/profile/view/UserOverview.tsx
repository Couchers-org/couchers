import { Card, CardActions, Tooltip, Typography } from "@material-ui/core";
import { VerifiedUser } from "@material-ui/icons";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";
import { Badges } from "./Badges";
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
    textAlign: "center",
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

  avatarContainer: {
    maxWidth: "75%",
    margin: "0 auto",
  },
  strongVerificationBadge: {
    display: "flex",
    alignItems: "center",
    marginLeft: theme.spacing(0.5),
  },
}));

type UserOverviewProps = {
  showHostAndMeetAvailability: boolean;
  actions?: React.ReactNode;
};

// @todo: move this into /components and decouple it from features/profile because it's used
//        from the dashboard as well
export default function UserOverview({
  showHostAndMeetAvailability,
  actions,
}: UserOverviewProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useStyles();
  const user = useProfileUser();

  return (
    <Card className={classes.card}>
      <div className={classes.avatarContainer}>
        <Avatar user={user} grow />
      </div>

      <div className={classes.wrapper}>
        <Typography variant="h1" className={classes.intro}>
          {user.name}
          {user.hasStrongVerification ? (
            <span className={classes.strongVerificationBadge}>
              <Tooltip title={t("profile:heading.strong_verification")}>
                <VerifiedUser
                  data-testid="strong-verification-id"
                  fontSize="inherit"
                  color="primary"
                />
              </Tooltip>
            </span>
          ) : null}
        </Typography>
        <Typography variant="body1" className={classes.intro}>
          {user.city}
        </Typography>
        <Badges user={user} />
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
              hostingStatusLabels(t)[
                user.hostingStatus || HostingStatus.HOSTING_STATUS_UNKNOWN
              ]
            }
          />
          <IconText
            icon={LocationIcon}
            text={
              meetupStatusLabels(t)[
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
            label={t("global:community_standing")}
            description={t("global:community_standing_description")}
          />
          <BarWithHelp
            value={user.verification || 0}
            label={t("global:verification_score")}
            description={t("global:verification_score_description")}
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
