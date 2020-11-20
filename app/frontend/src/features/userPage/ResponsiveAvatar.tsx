import React from "react";
import { User } from "../../pb/api_pb";
import { makeStyles } from "@material-ui/core";
import PageTitle from "../../components/PageTitle";
import Avatar from "../../components/Avatar";

const useStyles = makeStyles({
  root: {
    position: "relative",
    width: "100%",
    paddingTop: "100%",
  },
  avatar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
});

export default function ReponsiveAvatar({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return (
    <>
      <div className={classes.root}>
        <Avatar user={user} className={classes.avatar} />
      </div>
    </>
  );
}
