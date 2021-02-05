import { makeStyles } from "@material-ui/core";
import React from "react";

import { User } from "../../pb/api_pb";

const useStyles = makeStyles((theme) => ({
  root: {},
}));

export default function UserGuestbook({ user }: { user: User.AsObject }) {
  const classes = useStyles();
  return <>{user.numReferences} References....</>;
}
