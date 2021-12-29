import Hidden from "@material-ui/core/Hidden";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/profile/constants";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import ReferenceForm from "features/profile/view/leaveReference/ReferenceForm";
import UserOverview from "features/profile/view/UserOverview";
import { useUser } from "features/userQueries/useUsers";
import { User } from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import React from "react";
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

export default function LeaveReferencePage({
  referenceType,
  userId,
  hostRequestId,
}: {
  referenceType: string;
  userId: number;
  hostRequestId?: number;
}) {
  const classes = useStyles();

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useUser(userId);
  const {
    data: availableReferences,
    isLoading: isAvailableReferencesLoading,
    error: availableReferencesError,
  } = useListAvailableReferences(userId);

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

      {availableReferences &&
        user &&
        ((referenceType ===
          referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND] &&
          availableReferences.canWriteFriendReference &&
          user.friends === User.FriendshipStatus.FRIENDS) ||
        (hostRequestId &&
          availableReferences.availableWriteReferencesList.find(
            ({ hostRequestId: availableId }) => availableId === hostRequestId
          )) ? (
          <div className={classes.root}>
            <ProfileUserProvider user={user}>
              <Hidden smDown>
                <UserOverview />
              </Hidden>
              <div className={classes.form}>
                <ReferenceForm referenceType={referenceType} userId={userId} />
              </div>
            </ProfileUserProvider>
          </div>
        ) : (
          <Alert severity="error">{REFERENCE_TYPE_NOT_AVAILABLE}</Alert>
        ))}
    </>
  );
}
