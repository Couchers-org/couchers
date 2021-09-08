import { User } from "couchers-core/src/proto/api_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

export default function UserGuestbook({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return <>{user.numReferences} References....</>;
}
