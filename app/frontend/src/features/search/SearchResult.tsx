import {
  Card,
  CardActionArea,
  CardContent,
  Container,
  makeStyles,
  Typography,
} from "@material-ui/core";
import UserSummary from "components/UserSummary";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import {
  UserAgeGenderPronouns,
  UserLanguages,
  UserLastActive,
  UserReferences,
} from "features/user/UserDataLabels";
import { User } from "pb/api_pb";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.shape.borderRadius,
  },
  statusLabels: {
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
  const firstName = user.name.split(" ")[0];
  const missingAbout = user.aboutMe.length === 0;
  console.log(user);
  return (
    <Link to={routeToUser(user.username)} className={classes.root}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardContent>
            <UserSummary user={user}>
              <Container disableGutters={true}>
                <Typography
                  className={classes.statusLabels}
                  variant="subtitle1"
                  color="primary"
                >
                  {hostingStatusLabels[user.hostingStatus]}
                </Typography>
                <Typography
                  className={classes.statusLabels}
                  variant="subtitle1"
                  color="secondary"
                >
                  {meetupStatusLabels[user.meetupStatus]}
                </Typography>
              </Container>
              <Typography variant="h6">
                {missingAbout
                  ? `${firstName} hasn't said anything about themselves yet`
                  : user.aboutMe.length < 300
                  ? user.aboutMe
                  : user.aboutMe.substring(0, 300) + "..."}
              </Typography>
              <UserAgeGenderPronouns user={user} />
              <UserLanguages user={user} />
              <UserReferences user={user} />
              <UserLastActive user={user} />
            </UserSummary>
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
