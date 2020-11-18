import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  LinearProgress,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { User } from "../../pb/api_pb";
import TextBody from "../../components/TextBody";
import { hostingStatusLabels } from "../../constants";
import { Link } from "react-router-dom";
import { userRoute } from "../../AppRoutes";
import Avatar from "../../components/Avatar";

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
    borderRadius: 16,
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
  scoreBarContainer: {
    position: "relative",
    height: "1.6rem",
    width: 300,
    maxWidth: "100%",
    marginInlineStart: 0,
    marginBottom: theme.spacing(1),
  },
  scoreBar: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: ".8rem",
  },
  scoreBarLabel: {
    position: "absolute",
    width: "100%",
    lineHeight: "1.6rem",
    verticalAlign: "middle",
    paddingLeft: theme.spacing(1),
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

            <Container disableGutters className={classes.scoreBarContainer}>
              <LinearProgress
                variant="determinate"
                value={user.communityStanding * 100}
                className={classes.scoreBar}
              />
              <TextBody className={classes.scoreBarLabel}>
                Community Standing
              </TextBody>
            </Container>
            <Container disableGutters className={classes.scoreBarContainer}>
              <LinearProgress
                variant="determinate"
                value={user.verification * 100}
                className={classes.scoreBar}
              />
              <TextBody className={classes.scoreBarLabel}>
                Verification Score
              </TextBody>
            </Container>

            {user.aboutMe.length < 300
              ? user.aboutMe
              : user.aboutMe.substring(0, 300) + "..."}
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  );
}
