import { ListItemAvatar, ListItemText, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Avatar from "components/Avatar";
import ScoreBar from "components/Bar/ScoreBar";
import { COMMUNITY_STANDING } from "features/constants";
import { User } from "pb/api_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

export const useStyles = makeStyles((theme) => ({
  avatar: {
    height: theme.spacing(9),
    marginInlineEnd: theme.spacing(2),
    width: theme.spacing(9),
  },
  root: {
    display: "flex",
    padding: 0,
    width: "100%",
  },
  title: {
    marginTop: 0,
  },
  titleAndBarContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    margin: 0,
    minHeight: theme.spacing(9),
  },
}));

interface UserSummaryProps {
  children?: React.ReactNode;
  headlineComponent?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  user?: User.AsObject;
}

export default function UserSummary({
  children,
  headlineComponent = "h2",
  user,
}: UserSummaryProps) {
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
        className={classes.titleAndBarContainer}
        disableTypography
        primary={
          <Typography
            component={headlineComponent}
            variant="h2"
            className={classes.title}
          >
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
