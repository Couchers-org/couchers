import { makeStyles } from "@material-ui/core";
import { User } from "pb/api_pb";
import React from "react";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

export default function UserGuestbook({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return <>{user.numReferences} References....</>;
}
