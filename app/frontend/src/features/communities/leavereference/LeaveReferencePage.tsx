import Hidden from "@material-ui/core/Hidden";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import FriendReferenceForm from "features/communities/leavereference/FriendReferenceForm";
import RequestReferenceForm from "features/communities/leavereference/RequestReferenceForm";
import UserToReference from "features/communities/leavereference/UserToReference";
import { useUser } from "features/userQueries/useUsers";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import { User } from "pb/api_pb";
import { ReferenceType } from "pb/references_pb";
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
  timeExpires?: google_protobuf_timestamp_pb.Timestamp.AsObject;
}

export default function LeaveReferencePage({
  hostRequest,
}: //timeExpires,
LeaveReferenceProps) {
  const classes = useStyles(Boolean);
  const { referenceType, userId } = useParams<{
    referenceType: string;
    userId: string;
  }>();

  const { data: user, isLoading: isUserLoading, error } = useUser(+userId);
  const {
    data: availableRefrences,
    isLoading: isAvailableReferencesLoading,
  } = useListAvailableReferences(+userId, "all");

  const loading = isUserLoading || isAvailableReferencesLoading;

  if (!(referenceType in RefType)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  if (availableRefrences && user) {
    if (referenceType === "friend") {
      if (
        availableRefrences.canWriteFriendReference &&
        user.friends === User.FriendshipStatus.FRIENDS
      ) {
        return (
          <div className={classes.root}>
            {error && <Alert severity="error">{error}</Alert>}
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Hidden smDown>
                  <UserToReference user={user} />
                </Hidden>
                <div className={classes.form}>
                  <FriendReferenceForm user={user} />
                </div>
              </>
            )}
          </div>
        );
      }
    } else if (hostRequest) {
      const availableReference = availableRefrences.availableWriteReferencesList.find(
        ({ hostRequestId }) => hostRequestId === hostRequest
      );
      if (availableReference) {
        if (
          (referenceType === "surfed" &&
            availableReference.referenceType ===
              ReferenceType.REFERENCE_TYPE_SURFED) ||
          (referenceType === "hosted" &&
            availableReference.referenceType ===
              ReferenceType.REFERENCE_TYPE_HOSTED)
        ) {
          return (
            <div className={classes.root}>
              {error && <Alert severity="error">{error}</Alert>}
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Hidden smDown>
                    <UserToReference user={user} />
                  </Hidden>
                  <div className={classes.form}>
                    <RequestReferenceForm
                      user={user}
                      hostRequest={hostRequest}
                    />
                  </div>
                </>
              )}
            </div>
          );
        }
      }
    }
  }

  return <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>;
}
