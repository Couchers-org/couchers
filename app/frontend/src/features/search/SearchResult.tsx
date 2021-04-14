import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from "@material-ui/core";
import { CouchIcon, LocationIcon } from "components/Icons";
import UserSummary from "components/UserSummary";
import {
  aboutText,
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import {
  LabelsAgeGenderLanguages,
  LabelsReferencesLastActive,
} from "features/user/UserTextAndLabel";
import { User } from "pb/api_pb";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.shape.borderRadius * 3,
  },
  about: {
    margin: `${theme.spacing(2)} 0`,
  },
  statusLabelWrapper: {
    display: "flex",
    "& > div": {
      display: "flex",
    },
  },
  statusLabel: {
    marginLeft: theme.spacing(1),
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
            <UserSummary user={user}>
              <div className={classes.statusLabelWrapper}>
                <div>
                  <CouchIcon />
                  <Typography
                    className={classes.statusLabel}
                    display="inline"
                    variant="subtitle1"
                    color="primary"
                  >
                    {hostingStatusLabels[user.hostingStatus]}
                  </Typography>
                </div>
                <div>
                  <LocationIcon />
                  <Typography
                    className={classes.statusLabel}
                    display="inline"
                    variant="subtitle1"
                  >
                    {meetupStatusLabels[user.meetupStatus]}
                  </Typography>
                </div>
              </div>
            </UserSummary>
            <Typography variant="body1" className={classes.about}>
              {aboutText(user)}
            </Typography>
            <LabelsAgeGenderLanguages user={user} />
            <LabelsReferencesLastActive user={user} />
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
