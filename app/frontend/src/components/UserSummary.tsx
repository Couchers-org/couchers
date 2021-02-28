import {
  ListItemAvatar,
  ListItemText,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import React from "react";

import { COMMUNITY_STANDING } from "../features/constants";
import { User } from "../pb/api_pb";
import Avatar from "./Avatar";
import ScoreBar from "./Bar/ScoreBar";

export const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: "center",
    display: "flex",
    padding: 0,
    width: "100%",
  },
  title: {
    marginBottom: theme.spacing(1),
  },
  avatar: {
    height: theme.spacing(9),
    marginInlineEnd: theme.spacing(2),
    width: theme.spacing(9),
  },
}));

interface UserSummaryProps {
  children?: React.ReactNode;
  user?: User.AsObject;
}

export default function UserSummary({ children, user }: UserSummaryProps) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <ListItemAvatar>
        {!user ? (
          <Skeleton variant="circle" className={classes.avatar} />
        ) : (
          <Avatar user={user} className={classes.avatar} />
        )}
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={
          <Typography variant="h2" className={classes.title}>
            {!user ? <Skeleton /> : `${user.name}, ${user.age}, ${user.city}`}
          </Typography>
        }
        secondary={
          <>
            <ScoreBar value={(user?.communityStanding || 0) * 100}>
              {COMMUNITY_STANDING}
            </ScoreBar>
            {children}
          </>
        }
      />
    </div>
  );
}
