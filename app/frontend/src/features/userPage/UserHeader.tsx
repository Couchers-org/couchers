import React from "react";
import { User } from "../../pb/api_pb";
import { Box, makeStyles, Typography } from "@material-ui/core";
import PageTitle from "../../components/PageTitle";
import ScoreBar from "../../components/ScoreBar";
import { CouchIcon, EditIcon } from "../../components/Icons";
import Avatar from "../../components/Avatar";
import { useTypedSelector } from "../../store";
import { Link } from "react-router-dom";
import { profileRoute } from "../../AppRoutes";
import Button from "../../components/Button";
import { timestamp2Date } from "../../utils/date";
import { timeAgo } from "../../utils/timeAgo";
import { hostingStatusLabels } from "../profile/constants";
import TextBody from "../../components/TextBody";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  avatar: {
    maxWidth: 200,
    marginLeft: "auto",
    marginRight: "auto",
  },
  name: {
    marginBottom: theme.spacing(1),
  },
  hostStatusIcon: {
    marginInlineEnd: theme.spacing(1),
    display: "inline",
  },
  hostStatusLabel: {
    display: "inline",
  },
  editButton: {
    marginBottom: theme.spacing(2),
  },
}));

export default function UserHeader({ user }: { user: User.AsObject }) {
  const classes = useStyles();

  const isCurrentUser = useTypedSelector(
    (store) => store.auth.user?.userId === user.userId
  );

  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        <Avatar grow user={user} />
      </div>
      <PageTitle className={classes.name}>{user.name}</PageTitle>

      <Box>
        <Box className={classes.hostStatusIcon}>
          <CouchIcon />
        </Box>
        <TextBody className={classes.hostStatusLabel}>
          {hostingStatusLabels[user.hostingStatus]}
        </TextBody>
      </Box>

      {user.lastActive && (
        <Box mb={2}>
          <Typography component="p" variant="caption" gutterBottom>
            Last active {timeAgo(user.lastActive.seconds * 1000)}
          </Typography>
        </Box>
      )}

      {isCurrentUser && (
        <Button
          startIcon={<EditIcon />}
          component={Link}
          to={profileRoute}
          className={classes.editButton}
        >
          Edit your profile
        </Button>
      )}

      <ScoreBar value={user.communityStanding * 100}>
        Community Standing
      </ScoreBar>
      <ScoreBar value={user.verification * 100}>Verification Score</ScoreBar>
    </div>
  );
}
