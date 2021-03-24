import { Box, makeStyles, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import ScoreBar from "components/Bar/ScoreBar";
import { CouchIcon } from "components/Icons";
import IconText from "components/IconText";
import PageTitle from "components/PageTitle";
import { COMMUNITY_STANDING } from "features/constants";
import { hostingStatusLabels } from "features/profile/constants";
import { User } from "pb/api_pb";
import React from "react";
import { timestamp2Date } from "utils/date";
import { timeAgo } from "utils/timeAgo";

const useStyles = makeStyles((theme) => ({
  avatar: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 200,
  },
  editButton: {
    marginBottom: theme.spacing(2),
  },
  name: {
    marginBottom: theme.spacing(1),
  },
  root: {
    marginBottom: theme.spacing(2),
  },
}));

interface UserHeaderProps {
  children?: React.ReactNode;
  user: User.AsObject;
}

export default function UserHeader({ children, user }: UserHeaderProps) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        <Avatar grow user={user} isProfileLink={false} />
      </div>
      <PageTitle className={classes.name}>{user.name}</PageTitle>

      <IconText
        icon={CouchIcon}
        text={hostingStatusLabels[user.hostingStatus]}
      />

      {user.lastActive && (
        <Box mb={2}>
          <Typography component="p" variant="caption" gutterBottom>
            {timeAgo(timestamp2Date(user.lastActive))}
          </Typography>
        </Box>
      )}

      {children}

      <ScoreBar value={user.communityStanding * 100}>
        {COMMUNITY_STANDING}
      </ScoreBar>
      <ScoreBar value={user.verification * 100}>Verification Score</ScoreBar>
    </div>
  );
}
