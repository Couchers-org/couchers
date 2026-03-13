import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "features/profile/hooks/referencesHooks";
import ReferenceOverview from "features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import { ReferenceContextFormData } from "features/profile/view/leaveReference/ReferenceForm";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { useForm } from "react-hook-form";
import {
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";
import { theme } from "theme";
import useIsMobile from "utils/useIsMobile";

import ReferenceStepHeader from "../ReferenceStepHeader";

interface SubmitReferenceProps {
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

export default function SubmitReference({
  referenceData,
  referenceType,
  hostRequestId,
  userId,
}: SubmitReferenceProps) {
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
  const isMobile = useIsMobile();
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
              hostRequestId: hostRequestId,
              wasAppropriate: true,
              text: referenceData.text,
              rating: referenceData.rating,
              privateText: referenceData.privateText,
            }
          : {
              hostRequestId: hostRequestId,
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
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${referenceStepStrings[4]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}/${referenceStepStrings[4]}`,
      );
    }
  };

  const onSubmit =
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <ReferenceStepHeader isSubmitStep step="submit" />
        <ReferenceOverview referenceData={referenceData} />
        <StyledButtonContainer>
          <Button
            fullWidth={isMobile}
            type="submit"
            loading={isFriendReferenceLoading || isHostRequestReferenceLoading}
          >
            {t("global:submit")}
          </Button>
        </StyledButtonContainer>
      </form>
    </>
  );
}
