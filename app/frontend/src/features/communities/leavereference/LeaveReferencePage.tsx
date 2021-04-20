import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { INVALID_REFERENCE_TYPE } from "features/communities/constants";
import ReferenceForm from "features/communities/leavereference/ReferenceForm";
import RevieweeOverview from "features/communities/leavereference/RevieweeOverview";
import { useUser } from "features/userQueries/useUsers";
import React from "react";
import { useParams } from "react-router-dom";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  form: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  root: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-around",
    },
  },
}));

export enum ReferenceType {
  "friend",
  "surfed",
  "hosted",
}

export default function LeaveReferencePage() {
  const classes = useStyles();
  const { referenceType, id } = useParams<{
    referenceType: string;
    id: string;
  }>();

  // get user object from userId
  const { data: user, isLoading: loading, error } = useUser(+id, false);

  if (!(referenceType in ReferenceType)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{"errors"}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user ? (
        <>
          <RevieweeOverview user={user} />
          <div className={classes.form}>
            <ReferenceForm />
          </div>
        </>
      ) : (
        <Alert severity="warning">"No user"</Alert>
      )}
    </div>
  );
}
