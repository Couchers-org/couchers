import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import ReferenceForm from "features/communities/leavereference/ReferenceForm";
import RevieweeOverview from "features/communities/leavereference/RevieweeOverview";
import { useUser } from "features/userQueries/useUsers";
import { User } from "pb/api_pb";
import React from "react";
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
  const classes = useStyles(Boolean);
  const { referenceType, userId } = useParams<{
    referenceType: string;
    userId: string;
  }>();

  const { data: user, isLoading: isUserLoading, error } = useUser(
    +userId,
    false
  );
  const {
    data: availableRefrences,
    isLoading: isAvailableReferencesLoading,
  } = useListAvailableReferences(+userId, "all");

  if (!(referenceType in ReferenceType)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  let available = false;
  if (availableRefrences && user) {
    if (referenceType === "friend") {
      availableRefrences.canWriteFriendReference &&
      user.friends === User.FriendshipStatus.FRIENDS &&
      (available = true);
    } else if (referenceType === "surfed" && hostRequest) {
      availableRefrences.availableWriteReferencesList.includes({
        hostRequestId: hostRequest,
        referenceType: 2,
      }) && (available = true);
    } else if (referenceType === "hosted" && hostRequest) {
      availableRefrences.availableWriteReferencesList.includes({
        hostRequestId: hostRequest,
        referenceType: 3,
      }) && (available = true);
    }
  }

  const loading = isUserLoading || isAvailableReferencesLoading;

  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user && available ? (
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
