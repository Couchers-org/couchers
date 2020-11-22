import { makeStyles } from "@material-ui/core";
import React from "react";
import PageTitle from "../../components/PageTitle";
import HostingPreferenceForm from "./HostingPreferenceForm";
import { theme } from "../../theme";

const useStyles = makeStyles({
  title: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
  },
});

function EditHostingPreferencePage() {
  const classes = useStyles();

  return (
    <>
      <PageTitle className={classes.title}>Edit my place</PageTitle>
      <HostingPreferenceForm />
    </>
  );
}

export default EditHostingPreferencePage;
