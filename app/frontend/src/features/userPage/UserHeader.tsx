import React from "react";
import { User } from "../../pb/api_pb";
import { makeStyles } from "@material-ui/core";
import PageTitle from "../../components/PageTitle";
import ScoreBar from "../../components/ScoreBar";
import ResponsiveAvatar from "./ResponsiveAvatar";

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
    marginBottom: theme.spacing(2),
  },
}));

export default function UserHeader({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        <ResponsiveAvatar user={user} />
      </div>
      <PageTitle className={classes.name}>{user.name}</PageTitle>

      <ScoreBar
        label="Community Standing"
        value={user.communityStanding * 100}
      />
      <ScoreBar label="Verification Score" value={user.verification * 100} />
    </div>
  );
}
