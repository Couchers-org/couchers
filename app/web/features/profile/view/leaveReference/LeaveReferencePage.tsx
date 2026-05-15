import { styled, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import ReferenceForm from "features/profile/view/leaveReference/ReferenceForm";
import UserOverview from "features/profile/view/UserOverview";
import { hasGivenHostRequestReferenceKey } from "features/queryKeys";
import { useProfile } from "features/userQueries/useProfile";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { User } from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";
import React from "react";
import { ReferenceStep, referenceTypeRoute } from "routes";
import { service } from "service";
import { ReferenceTypeStrings } from "service/references";
import { theme } from "theme";

const StyledRoot = styled("div")(({ theme }) => ({
  padding: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    display: "grid",
    gridTemplateColumns: "2fr 3fr",
    gap: theme.spacing(3),
    margin: theme.spacing(0, 3),
    padding: 0,
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "2fr 4fr",
    maxWidth: "61.5rem",
    margin: "0 auto",
  },
}));

const StyledFormWrapper = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    margin: 0,
    width: "100%",
  },
  flexGrow: 1,
  margin: theme.spacing(2),
  padding: theme.spacing(2),
}));

export default function LeaveReferencePage({
  referenceType,
  userId,
  hostRequestId,
  step = "did-stay",
}: {
  referenceType: string;
  userId: number;
  hostRequestId?: number;
  step?: ReferenceStep;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data: statusRes } = useQuery({
    queryKey: [hasGivenHostRequestReferenceKey, hostRequestId],
    queryFn: () =>
      service.references.getHostRequestReferenceStatus(hostRequestId!),
    enabled: !!hostRequestId,
  });

  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useUser(userId);
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfile(userId);
  const {
    data: availableReferences,
    isLoading: isAvailableReferencesLoading,
    error: availableReferencesError,
  } = useListAvailableReferences(userId);

  const referenceTypeValid = referenceType in ReferenceTypeStrings;

  if (!referenceTypeValid) {
    return (
      <Alert severity="error">
        {t("profile:leave_reference.invalid_reference_type")}
      </Alert>
    );
  }

  if (userError || profileError || availableReferencesError) {
    return (
      <Alert severity="error">
        {userError ||
          profileError?.message ||
          availableReferencesError?.message ||
          ""}
      </Alert>
    );
  }
  if (isUserLoading || isProfileLoading || isAvailableReferencesLoading) {
    return <CenteredSpinner />;
  }

  // Compute availability booleans
  const isFriendType =
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND];
  const canWriteFriendRef = !!availableReferences?.canWriteFriendReference;
  const isFriendsWithUser = user?.friends === User.FriendshipStatus.FRIENDS;
  const canWriteFriendReferenceForUser =
    isFriendType && canWriteFriendRef && isFriendsWithUser;

  const canWriteHostRequestReference =
    !!hostRequestId &&
    !!availableReferences?.availableWriteReferencesList?.some(
      ({ hostRequestId: availableId }) => availableId === hostRequestId,
    );

  const canWriteReference =
    canWriteFriendReferenceForUser || canWriteHostRequestReference;

  if (isFriendType && !isFriendsWithUser) {
    return (
      <Alert severity="error">
        {t("profile:leave_reference.friend_reference_requires_friendship")}
      </Alert>
    );
  }

  if (isFriendType && isFriendsWithUser && !canWriteFriendRef) {
    return (
      <Alert severity="info">
        {t("profile:leave_reference.already_wrote_friend_reference")}
      </Alert>
    );
  }

  const alreadyWroteThisStay = !!hostRequestId && !!statusRes?.hasGiven;

  const isExpired = !!hostRequestId && !!statusRes && statusRes.isExpired;
  const didntStay = !!hostRequestId && !!statusRes && statusRes.didntStay;

  if (alreadyWroteThisStay) {
    return (
      <Alert severity="info">
        {t("profile:leave_reference.already_wrote_reference_for_stay")}
      </Alert>
    );
  }

  if (!!hostRequestId && didntStay) {
    return (
      <Alert severity="error">
        {t("profile:leave_reference.cant_write_reference_didnt_stay")}
      </Alert>
    );
  }

  if (!!hostRequestId && isExpired) {
    return (
      <Alert severity="error">
        {t("profile:leave_reference.cant_write_reference_expired")}
      </Alert>
    );
  }

  if (!canWriteReference) {
    return (
      <Alert severity="error">
        {t("profile:leave_reference.reference_type_not_available")}
      </Alert>
    );
  }

  return (
    <StyledRoot>
      <ProfileUserProvider user={user!} profile={profile!}>
        {!isMobile && <UserOverview showHostAndMeetAvailability={false} />}
        <StyledFormWrapper>
          <ReferenceForm
            hostRequestId={hostRequestId}
            referenceType={referenceType}
            userId={userId}
            step={step}
          />
        </StyledFormWrapper>
      </ProfileUserProvider>
    </StyledRoot>
  );
}
