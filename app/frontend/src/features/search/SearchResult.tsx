import {
  Card,
  CardActionArea,
  CardContent,
  Container,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Avatar from "components/Avatar";
import ScoreBar from "components/Bar/ScoreBar";
import { COMMUNITY_STANDING, VERIFICATION_SCORE } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { User } from "pb/api_pb";
import React from "react";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";

const useStyles = makeStyles((theme) => ({
  card: {
    borderRadius: theme.shape.borderRadius,
  },
  resultHeader: {
    alignItems: "center",
    display: "flex",
    marginBottom: theme.spacing(1),
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
            <div className={classes.resultHeader}>
              <Avatar user={user} />
              <Container>
                <Typography variant="h2">{user.name}</Typography>
                <Typography variant="subtitle1">
                  {hostingStatusLabels[user.hostingStatus]}
                </Typography>
              </Container>
            </div>

            <ScoreBar value={user.communityStanding * 100}>
              {COMMUNITY_STANDING}
            </ScoreBar>
            <ScoreBar value={user.verification * 100}>
              {VERIFICATION_SCORE}
            </ScoreBar>

            {user.aboutMe.length < 300
              ? user.aboutMe
              : user.aboutMe.substring(0, 300) + "..."}
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
