import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import ReferenceForm from "features/communities/leavereference/ReferenceForm";
import RevieweeOverview from "features/communities/leavereference/RevieweeOverview";
import { useUser } from "features/userQueries/useUsers";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import { useListAvailableReferences } from "../hooks";

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

interface LeaveReferenceProps {
  hostRequest?: number;
}

export default function LeaveReferencePage({
  hostRequest,
}: LeaveReferenceProps) {
  const classes = useStyles();
  const [available, setAvailable] = useState(false);
  const { referenceType, userId } = useParams<{
    referenceType: string;
    userId: string;
  }>();

  // get user object from userId
  const { data: user, isLoading: isUserLoading, error } = useUser(
    +userId,
    false
  );
  const {
    data: availableRefrences,
    isLoading: isAvailableReferencesLoading,
  } = useListAvailableReferences(+userId);
  /* HAS TO CHECK:
      [x] whether reference type is valid
      [] whether friends/ surfed/ couched is true
  */

  if (!(referenceType in ReferenceType)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  if (availableRefrences !== undefined && hostRequest) {
    if (referenceType === "friend") {
      availableRefrences.canWriteFriendReference && setAvailable(true);
    } else if (referenceType === "surfed") {
      availableRefrences.availableWriteReferencesList.includes({
        hostRequestId: hostRequest,
        referenceType: 2,
      }) && setAvailable(true);
    } else if (referenceType === "hosted") {
      availableRefrences.availableWriteReferencesList.includes({
        hostRequestId: hostRequest,
        referenceType: 3,
      }) && setAvailable(true);
    }
  }

  const loading = isUserLoading || isAvailableReferencesLoading;

  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user && available === true ? (
        <>
          <RevieweeOverview user={user} />
          <div className={classes.form}>
            <ReferenceForm user={user} />
          </div>
        </>
      ) : (
        <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>
      )}
    </div>
  );
}
