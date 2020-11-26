import React from "react";
import { User } from "../../pb/api_pb";
import { Box, makeStyles, Typography } from "@material-ui/core";
import PageTitle from "../../components/PageTitle";
import ScoreBar from "../../components/ScoreBar";
import { CouchIcon, EditIcon } from "../../components/Icons";
///TODO: Replace this with upstream avatar
import ResponsiveAvatar from "./ResponsiveAvatar";
import { useTypedSelector } from "../../store";
import { Link } from "react-router-dom";
import { profileRoute } from "../../AppRoutes";
import Button from "../../components/Button";
import { timeAgo } from "../../utils/timeAgo";
import { hostingStatusLabels } from "../../constants";
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
    //workaround for https://github.com/cssinjs/jss/issues/1414
    //still present despite upgrading to 10.5.0
    marginInlineEnd: `${theme.spacing(1)}px`,
    display: "inline",
  },
  hostStatusLabel: {
    display: "inline",
  },
  editButton: {
    marginBottom: theme.spacing(2),
  },
  lastActive: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.typography.caption.color,
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
        <ResponsiveAvatar user={user} />
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
        <Typography component="p" className={classes.lastActive}>
          Last active {timeAgo(user.lastActive.seconds * 1000)}
        </Typography>
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

      <ScoreBar
        label="Community Standing"
        value={user.communityStanding * 100}
      />
      <ScoreBar label="Verification Score" value={user.verification * 100} />
    </div>
  );
}
