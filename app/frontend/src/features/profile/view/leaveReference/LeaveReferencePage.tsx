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
import { referenceTypeRoute } from "routes";
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
  const classes = useStyles();
  const { referenceType, userId, hostRequestId: hostRequest } =
    useParams<{
      referenceType: string;
      userId: string;
      hostRequestId?: string;
    }>();

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useUser(+userId);
  const {
    data: availableRefrences,
    isLoading: isAvailableReferencesLoading,
    error: availableReferencesError,
  } = useListAvailableReferences(+userId);

  if (!(referenceType in ReferenceTypeStrings)) {
    return <Alert severity="error">{INVALID_REFERENCE_TYPE}</Alert>;
  }

  return (
    <>
      {(userError || availableReferencesError) && (
        <Alert severity="error">
          {userError || availableReferencesError?.message || ""}
        </Alert>
      )}
      {(isUserLoading || isAvailableReferencesLoading) && <CircularProgress />}

      {availableRefrences &&
        user &&
        ((referenceType ===
          referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND] &&
          availableRefrences.canWriteFriendReference &&
          user.friends === User.FriendshipStatus.FRIENDS) ||
        (hostRequest &&
          availableRefrences.availableWriteReferencesList.find(
            ({ hostRequestId }) => hostRequestId === +hostRequest
          )) ? (
          <div className={classes.root}>
            <>
              <Hidden smDown>
                <UserOverview user={user} />
              </Hidden>
              <div className={classes.form}>
                <ReferenceForm user={user} />
              </div>
            </>
          </div>
        ) : (
          <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>
        ))}
    </>
  );
}
