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
import { LabelsReferencesLastActive } from "features/user/UserTextAndLabel";
import { User } from "pb/api_pb";
import makeStyles from "utils/makeStyles";

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

interface UserSummaryProps {
  user: User.AsObject;
  children?: React.ReactNode;
}

export default function UserOverview({ children, user }: UserSummaryProps) {
  const classes = useStyles();

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
      {children}
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
        <LabelsReferencesLastActive user={user} />
      </div>
    </Card>
  );
}
