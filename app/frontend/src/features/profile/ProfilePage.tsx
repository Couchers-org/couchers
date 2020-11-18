import { makeStyles } from "@material-ui/core";
import React from "react";
import UserInfoForm from "./UserInfoForm";

const useStyles = makeStyles({
  root: {},
});

export default function ProfilePage() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1>Profile</h1>
      <UserInfoForm />
    </div>
  );
}
