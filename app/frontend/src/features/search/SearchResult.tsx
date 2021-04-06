import {
  Card,
  CardActionArea,
  CardContent,
  Hidden,
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
  about: {
    margin: `${theme.spacing(2)} 0`,
  },
  card: {
    boxShadow: "5px 5px 5px rgba(196, 196, 196, 0.5)", // todo
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(1),
  },
  cardContent: {
    padding: 0,
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
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
    textDecoration: "none",
    // width: "100%",
  },
}));

export default function SearchResult({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <Link to={routeToUser(user.username)} className={classes.root}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardContent className={classes.cardContent}>
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
            <Hidden mdDown>
              <LabelsAgeGenderLanguages user={user} />
              <LabelsReferencesLastActive user={user} />
            </Hidden>
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
