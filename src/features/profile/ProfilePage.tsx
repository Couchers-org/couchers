import { makeStyles } from "@material-ui/core";
import React from "react";
import HostingPreferenceForm from "./HostingPreferenceForm";

const useStyles = makeStyles({
  root: {},
});

export default function ProfilePage() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <h1>Profile</h1>
      <HostingPreferenceForm />
    </div>
  );
}
