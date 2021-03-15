import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
import LabelAndText from "components/LabelAndText";
import UserSummary from "components/UserSummary";
import {
  AGE_GENDER,
  LANGUAGES_FLUENT,
  LAST_ACTIVE,
  REFERENCES,
} from "features/constants";
import {
  aboutText,
  hostingStatusLabels,
  LANGUAGES_FLUENT_FALSE,
  LAST_ACTIVE_FALSE,
  meetupStatusLabels,
} from "features/profile/constants";
import { User } from "pb/api_pb";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";
import { timestamp2Date } from "utils/date";
import { timeAgo } from "utils/timeAgo";

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.shape.borderRadius,
  },
  about: {
    margin: `${theme.spacing(2)} 0`,
  },
  statusLabelWrapper: {
    display: "flex",
    marginLeft: theme.spacing(11),
  },
  statusLabel: {
    marginRight: theme.spacing(2),
  },
  root: {
    [theme.breakpoints.up("sm")]: {
      width: "49%",
    },
    marginBottom: theme.spacing(2),
    textDecoration: "none",
    width: "100%",
  },
}));

export default function SearchResult({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <Link to={routeToUser(user.username)} className={classes.root}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardContent>
            <UserSummary user={user} />
            <div className={classes.statusLabelWrapper}>
              <Typography
                className={classes.statusLabel}
                display="inline"
                variant="subtitle1"
                color="primary"
              >
                {hostingStatusLabels[user.hostingStatus]}
              </Typography>
              <Typography
                className={classes.statusLabel}
                display="inline"
                variant="subtitle1"
                color="secondary"
              >
                {meetupStatusLabels[user.meetupStatus]}
              </Typography>
            </div>
            <Typography component="h3" variant="h6" className={classes.about}>
              {aboutText(user)}
            </Typography>
            <LabelAndText
              label={AGE_GENDER}
              text={`${user.age} / ${user.gender} ${
                user.pronouns ? `(${user.pronouns})` : ""
              }`}
            />
            <LabelAndText
              label={LANGUAGES_FLUENT}
              text={
                user.languagesList.toString().replace(",", ", ") ||
                LANGUAGES_FLUENT_FALSE
              }
            />
            <LabelAndText
              label={REFERENCES}
              text={`${user.numReferences || 0}`}
            />
            <LabelAndText
              label={LAST_ACTIVE}
              text={
                user.lastActive
                  ? timeAgo(timestamp2Date(user.lastActive))
                  : LAST_ACTIVE_FALSE
              }
            />
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
