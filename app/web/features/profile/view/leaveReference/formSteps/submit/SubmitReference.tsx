import { styled, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "@/features/profile/hooks/referencesHooks";
import { ReferenceContextFormData } from "@/features/profile/view/leaveReference/ReferenceForm";
import ReferenceStepHeader from "@/features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import ReferenceOverview from "@/features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import { useTranslation } from "@/i18n";
import { GLOBAL, PROFILE } from "@/i18n/namespaces";
import { ReferenceType } from "@/proto/references_pb";
import {
  LEAVE_REFERENCE_BASE_ROUTE,
  REFERENCE_STEP_STRINGS,
  REFERENCE_TYPE_ROUTE,
} from "@/routes";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "@/service/references";
import { theme } from "@/theme";

export interface SubmitReferenceProps {
  referenceData: ReferenceContextFormData;
  referenceType: string;
  hostRequestId?: number;
  userId: number;
}

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

const SubmitReference = ({
  referenceData,
  referenceType,
  hostRequestId,
  userId,
}: SubmitReferenceProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const {
    writeFriendReference,
    reset: resetFriendReferenceWriting,
    error: friendReferenceError,
    isPending: isFriendReferenceLoading,
  } = useWriteFriendReference(userId);
  const {
    writeHostRequestReference,
    reset: resetHostRequestReferenceWriting,
    error: hostRequestReferenceError,
    isPending: isHostRequestReferenceLoading,
  } = useWriteHostReference(userId);

  const router = useRouter();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { handleSubmit } = useForm<ReferenceContextFormData>();

  const onFriendReferenceSubmit = () => {
    if (referenceData.rating === undefined) {
      return;
    }

    const formData: WriteFriendReferenceInput =
      referenceData.wasAppropriate === "true"
        ? {
            toUserId: userId,
            wasAppropriate: true,
            text: referenceData.text,
            rating: referenceData.rating,
          }
        : {
            toUserId: userId,
            wasAppropriate: false,
            text: referenceData.text,
            rating: referenceData.rating,
          };

    resetFriendReferenceWriting();
    writeFriendReference(
      {
        referenceData: formData,
      },
      {
        onSuccess: () => {
          redirectToThankYouPage();
        },
      },
    );
    window.scroll({ top: 0 });
  };

  const onHostReferenceSubmit = () => {
    if (
      hostRequestId &&
      !isNaN(hostRequestId) &&
      referenceData.rating !== undefined
    ) {
      const formData: WriteHostRequestReferenceInput =
        referenceData.wasAppropriate === "true"
          ? {
              hostRequestId,
              wasAppropriate: true,
              text: referenceData.text,
              rating: referenceData.rating,
              privateText: referenceData.privateText,
            }
          : {
              hostRequestId,
              wasAppropriate: false,
              text: referenceData.text,
              rating: referenceData.rating,
              privateText: referenceData.privateText,
            };

      resetHostRequestReferenceWriting();
      writeHostRequestReference(
        {
          referenceData: formData,
        },
        {
          onSuccess: () => {
            redirectToThankYouPage();
          },
        },
      );
      window.scroll({ top: 0 });
    }
  };

  const redirectToThankYouPage = () => {
    if (
      referenceType ===
      REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      void router.push(
        `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${REFERENCE_STEP_STRINGS[4]}`,
      );
    } else {
      // TODO(FB) Handle undefined hostRequestId properly
      void router.push(
        `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${hostRequestId ?? ""}/${REFERENCE_STEP_STRINGS[4]}`,
      );
    }
  };

  const onSubmit =
    referenceType === REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? onFriendReferenceSubmit
      : onHostReferenceSubmit;

  return (
    <>
      {friendReferenceError ? (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
          {friendReferenceError.message}
        </Alert>
      ) : hostRequestReferenceError ? (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
          {hostRequestReferenceError.message}
        </Alert>
      ) : null}

      <form onSubmit={() => handleSubmit(onSubmit)}>
        <ReferenceStepHeader isSubmitStep />
        <ReferenceOverview referenceData={referenceData} />
        <StyledButtonContainer>
          <Button
            fullWidth={!isSmOrWider}
            type="submit"
            loading={isFriendReferenceLoading || isHostRequestReferenceLoading}
          >
            {t("global:submit")}
          </Button>
        </StyledButtonContainer>
      </form>
    </>
  );
};

export default SubmitReference;
