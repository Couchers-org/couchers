import Hidden from "@material-ui/core/Hidden";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { User } from "couchers-core/src/proto/api_pb";
import { ReferenceType } from "couchers-core/src/proto/references_pb";
import { ReferenceTypeStrings } from "couchers-core/dist/service/references";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import ReferenceForm from "features/profile/view/leaveReference/ReferenceForm";
import UserOverview from "features/profile/view/UserOverview";
import { useUser } from "features/userQueries/useUsers";
import React from "react";
import { useParams } from "react-router-dom";
import { referenceTypeRoute } from "routes";
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
  const { referenceType, userId, hostRequestId } = useParams<{
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
        (hostRequestId &&
          availableRefrences.availableWriteReferencesList.find(
            ({ hostRequestId: availableId }) => availableId === +hostRequestId
          )) ? (
          <div className={classes.root}>
            <ProfileUserProvider user={user}>
              <Hidden smDown>
                <UserOverview />
              </Hidden>
              <div className={classes.form}>
                <ReferenceForm />
              </div>
            </ProfileUserProvider>
          </div>
        ) : (
          <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>
        ))}
    </>
  );
}
