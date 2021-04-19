import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { INVALID_REFERENCE_TYPE } from "features/communities/constants";
import ReferenceForm from "features/communities/leavereference/ReferenceForm";
import RevieweeOverview from "features/communities/leavereference/RevieweeOverview";
import { useUser } from "features/userQueries/useUsers";
import { ReferenceType } from "pb/references_pb";
import React from "react";
import { useParams } from "react-router-dom";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-around",
    },
  },
}));

export default function LeaveReferencePage() {
  const classes = useStyles();
  const { referenceType, id } = useParams<{
    referenceType: string;
    id: string;
  }>();

  // get user object from userId
  const userId = parseInt(id);
  const { data: user, isLoading: loading, error } = useUser(userId);

  if (referenceType! in ReferenceType) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user ? (
        <>
          <RevieweeOverview user={user} />
          <ReferenceForm />
        </>
      ) : null}
    </div>
  );
}
