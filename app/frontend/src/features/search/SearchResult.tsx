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
  textLabels: {
    marginTop: theme.spacing(2),
  },
  about: {
    margin: `${theme.spacing(2)} 0`,
  },
  statusLabelWrapper: {
    display: "flex",
    marginLeft: theme.spacing(11),
    width: "auto",
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
  const firstName = user.name.split(" ")[0];
  const missingAbout = user.aboutMe.length === 0;
  console.log(user);
  return (
    <Link to={routeToUser(user.username)} className={classes.root}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardContent>
            <UserSummary user={user}>
              {/* I think this container would sit more nicely inside UserSummary, to align 
                  better with the Avater but I don't know whether we want to show
                  hosting/meetup status in other areas we're using the UserSummary component */}
              <Container
                disableGutters={true}
                className={classes.statusLabelWrapper}
              >
                <Typography
                  className={classes.statusLabel}
                  display="inline"
                  variant="subtitle1"
                  color="primary"
                >
                  {/* This "ask me about hosting/about meeting up" text can be changed when we add the icons in
                      but at the moment just having Ask Me without a label is unclear" */}
                  {hostingStatusLabels[user.hostingStatus] === "Ask me"
                    ? `${hostingStatusLabels[user.hostingStatus]} about hosting`
                    : hostingStatusLabels[user.hostingStatus]}
                </Typography>
                <Typography
                  className={classes.statusLabel}
                  display="inline"
                  variant="subtitle1"
                  color="secondary"
                >
                  {meetupStatusLabels[user.meetupStatus] === "Ask me"
                    ? `${
                        meetupStatusLabels[user.meetupStatus]
                      } about meeting up`
                    : meetupStatusLabels[user.meetupStatus]}
                </Typography>
              </Container>
              <Typography variant="h6" className={classes.about}>
                {missingAbout
                  ? `${firstName} hasn't said anything about themselves yet`
                  : user.aboutMe.length < 300
                  ? user.aboutMe
                  : user.aboutMe.substring(0, 300) + "..."}
              </Typography>
              <div className={classes.textLabels}>
                <UserAgeGenderPronouns user={user} />
                <UserLanguages user={user} />
                <UserReferences user={user} />
                <UserLastActive user={user} />
              </div>
            </UserSummary>
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
