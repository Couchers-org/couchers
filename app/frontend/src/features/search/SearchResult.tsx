import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { User } from "../../pb/api_pb";
import TextBody from "../../components/TextBody";
import { hostingStatusLabels } from "../profile/constants";
import { Link } from "react-router-dom";
import { userRoute } from "../../AppRoutes";
import Avatar from "../../components/Avatar";
import ScoreBar from "../../components/ScoreBar";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    textDecoration: "none",
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "49%",
    },
  },
  card: {
    borderRadius: theme.shape.borderRadius,
  },
  resultHeader: {
    marginBottom: theme.spacing(1),
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "1.5em",
  },
}));

export default function SearchResult({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <Link to={`${userRoute}/${user.username}`} className={classes.root}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              className={classes.resultHeader}
            >
              <Avatar user={user} />
              <Container>
                <Typography variant="h3" className={classes.title}>
                  {user.name}
                </Typography>
                <TextBody className={classes.subtitle}>
                  {hostingStatusLabels[user.hostingStatus]}
                </TextBody>
              </Container>
            </Box>

            <ScoreBar value={user.communityStanding * 100}>
              Community Standing
            </ScoreBar>
            <ScoreBar value={user.verification * 100}>
              Verification Score
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
