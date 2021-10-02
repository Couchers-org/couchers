import { Card, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Divider from "components/Divider";
import {
  COMMUNITY_STANDING,
  COMMUNITY_STANDING_DESCRIPTION,
  VERIFICATION_SCORE,
  VERIFICATION_SCORE_DESCRIPTION,
} from "features/constants";
import { PropsWithChildren } from "react";
import makeStyles from "utils/makeStyles";

import { useProfileUser } from "../hooks/useProfileUser";
import { LabelsReferencesLastActive } from "./UserTextAndLabel";

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
  },

  wrapper: {
    marginTop: theme.spacing(2),
    "& h1": {
      textAlign: "center",
      marginBottom: theme.spacing(0.5),
    },
  },
}));

export default function UserOverview({ children }: PropsWithChildren<unknown>) {
  const classes = useStyles();
  const user = useProfileUser();

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
      {children}
      {process.env.REACT_APP_IS_VERIFICATION_ENABLED && (
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
        <LabelsReferencesLastActive user={user} />
      </div>
    </Card>
  );
}
