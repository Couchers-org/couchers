import { User } from "@couchers/services/api";
import { ReferenceType } from "@couchers/services/references";
import { styled, useMediaQuery } from "@mui/material";
import React from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { useListAvailableReferences } from "@/features/profile/hooks/referencesHooks";
import { ProfileUserProvider } from "@/features/profile/hooks/useProfileUser";
import UserOverview from "@/features/profile/view/UserOverview";
import ReferenceForm from "@/features/profile/view/leaveReference/ReferenceForm";
import { useUser } from "@/features/userQueries/useUsers";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { REFERENCE_TYPE_ROUTE, ReferenceStep } from "@/routes";
import { ReferenceTypeStrings } from "@/service/references";
import { theme } from "@/theme";

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

const LeaveReferencePage = ({
  referenceType,
  userId,
  hostRequestId,
  step = "did-stay",
}: {
  referenceType: string;
  userId: number;
  hostRequestId?: number;
  step?: ReferenceStep;
}) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const isBelowMedium = useMediaQuery(theme.breakpoints.down("md"));

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
    return (
      <Alert severity="error">
        {t("profile:leave_reference.invalid_reference_type")}
      </Alert>
    );
  }

  return (
    <>
      {(userError || availableReferencesError) && (
        <Alert severity="error">
          {userError || availableReferencesError?.message || ""}
        </Alert>
      )}
      {(isUserLoading || isAvailableReferencesLoading) && <CenteredSpinner />}
      {availableReferences &&
        user &&
        ((referenceType ===
          REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND] &&
          availableReferences.canWriteFriendReference &&
          user.friends === User.FriendshipStatus.FRIENDS) ||
        (hostRequestId &&
          availableReferences.availableWriteReferencesList.find(
            ({ hostRequestId: availableId }) => availableId === hostRequestId,
          )) ? (
          <StyledRoot>
            <ProfileUserProvider user={user}>
              {!isBelowMedium && (
                <UserOverview showHostAndMeetAvailability={false} />
              )}
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
        ) : (
          <Alert severity="error">
            {t("profile:leave_reference.reference_type_not_available")}
          </Alert>
        ))}
    </>
  );
};

export default LeaveReferencePage;
