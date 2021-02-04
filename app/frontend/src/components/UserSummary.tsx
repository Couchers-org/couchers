import {
  Box,
  ListItemAvatar,
  ListItemText,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import React from "react";

import { User } from "../pb/api_pb";
import Avatar from "./Avatar";
import HostStatus from "./HostStatus";
import ScoreBar from "./ScoreBar";

const useStyles = makeStyles((theme) => ({
  root: { display: "flex", alignItems: "center", padding: 0 },
  title: {
    marginBottom: theme.spacing(1),
  },
  hostingAbilityContainer: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: theme.spacing(7),
    height: theme.spacing(7),
    marginInlineEnd: theme.spacing(2),
  },
}));

interface UserSummaryProps {
  user?: User.AsObject;
}

export default function UserSummary({ user }: UserSummaryProps) {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
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
          <Typography variant="h2" noWrap className={classes.title}>
            {!user ? <Skeleton /> : `${user.name}, ${user.age}, ${user.city}`}
          </Typography>
        }
        secondary={
          <>
            <Box>
              <ScoreBar value={user?.verification || 0}>
                Community Standing
              </ScoreBar>
              <Box className={classes.hostingAbilityContainer}>
                {user ? <HostStatus user={user} /> : <Skeleton width={100} />}
              </Box>
            </Box>
          </>
        }
      />
    </Box>
  );
}
