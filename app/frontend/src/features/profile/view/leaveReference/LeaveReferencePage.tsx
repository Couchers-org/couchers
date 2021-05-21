import Hidden from "@material-ui/core/Hidden";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import ReferenceForm from "features/profile/view/leaveReference/ReferenceForm";
import UserOverview from "features/profile/view/UserOverview";
import { useUser } from "features/userQueries/useUsers";
import { User } from "pb/api_pb";
import { ReferenceType } from "pb/references_pb";
import React from "react";
import { useParams } from "react-router-dom";
import { ReferenceTypeStrings } from "service/references";
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

export default function LeaveReferencePage() {
  const classes = useStyles(Boolean);
  const { referenceType, userId, hostRequest } = useParams<{
    referenceType: string;
    userId: string;
    hostRequest?: string;
  }>();

  const { data: user, error } = useUser(+userId);
  const { data: availableRefrences } = useListAvailableReferences(+userId);

  if (!(referenceType in ReferenceTypeStrings)) {
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
            <>
              <Hidden smDown>
                <UserOverview user={user} />
              </Hidden>
              <div className={classes.form}>
                <ReferenceForm user={user} />
              </div>
            </>
          </div>
        );
      }
    } else if (hostRequest) {
      const availableReference = availableRefrences.availableWriteReferencesList.find(
        ({ hostRequestId }) => hostRequestId === +hostRequest
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
              <>
                <Hidden smDown>
                  <UserOverview user={user} />
                </Hidden>
                <div className={classes.form}>
                  <ReferenceForm user={user} />
                </div>
              </>
            </div>
          );
        }
      }
    }
  } else {
    return <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>;
  }

  return <CircularProgress />;
}
