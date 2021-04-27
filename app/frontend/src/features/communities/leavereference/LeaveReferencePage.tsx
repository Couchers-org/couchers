import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import ReferenceForm from "features/communities/leavereference/ReferenceForm";
import UserToReference from "features/communities/leavereference/UserToReference";
import { useUser } from "features/userQueries/useUsers";
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import { User } from "pb/api_pb";
import { ReferenceType }from "pb/references_pb";
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

export enum RefType {
  "friend",
  "surfed",
  "hosted",
}

interface LeaveReferenceProps {
  hostRequest?: number;
  timeExpires?: google_protobuf_timestamp_pb.Timestamp.AsObject,
}

export default function LeaveReferencePage({
  hostRequest,
  timeExpires,
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

  if (!(referenceType in RefType)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }


  let available = false;
  if (availableRefrences && user) {
    if (referenceType === "friend") {
      availableRefrences.canWriteFriendReference &&
        user.friends === User.FriendshipStatus.FRIENDS &&
        (available = true);
    } else if (hostRequest) {
      const availableReference = availableRefrences.availableWriteReferencesList.find( ({hostRequestId}) => hostRequestId === hostRequest)
      availableReference && (
        referenceType === "surfed" ? ( 
        availableReference.referenceType === ReferenceType.REFERENCE_TYPE_SURFED && 
        (available = true)) : (
          availableReference.referenceType === ReferenceType.REFERENCE_TYPE_HOSTED && 
        (available = true)
        )); 
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
          <UserToReference user={user} />
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
