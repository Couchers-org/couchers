import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { hostRequestReferenceSuccessDialogId } from "features/profile/constants";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "features/profile/hooks/referencesHooks";
import ReferenceOverview from "features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import {
  ReferenceContextFormData,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  baseRoute,
  referenceTypeRoute,
  routeToProfile,
  routeToUser,
} from "routes";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

import ReferenceStepHeader from "../ReferenceStepHeader";

export interface SubmitReferenceProps {
  referenceData: ReferenceContextFormData;
  referenceType: string;
  hostRequestId?: number;
  userId: number;
}

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
    isLoading: isFriendReferenceLoading,
  } = useWriteFriendReference(userId);
  const {
    writeHostRequestReference,
    reset: resetHostRequestReferenceWriting,
    error: hostRequestReferenceError,
    isLoading: isHostRequestReferenceLoading,
  } = useWriteHostReference(userId);

  const theme = useTheme();
  const classes = useReferenceStyles();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { handleSubmit } = useForm<ReferenceContextFormData>();

  const userQuery = useUser(userId);
  const onFriendReferenceSubmit = () => {
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
          if (userQuery.data) {
            router.push(routeToUser(userQuery.data.username, "references"));
          } else {
            router.push(routeToProfile("references"));
          }
        },
      }
    );
    window.scroll({ top: 0 });
  };

  const onHostReferenceSubmit = () => {
    if (hostRequestId && !isNaN(hostRequestId)) {
      const formData: WriteHostRequestReferenceInput =
        referenceData.wasAppropriate === "true"
          ? {
              hostRequestId: hostRequestId,
              wasAppropriate: true,
              text: referenceData.text,
              rating: referenceData.rating,
            }
          : {
              hostRequestId: hostRequestId,
              wasAppropriate: false,
              text: referenceData.text,
              rating: referenceData.rating,
            };

      resetHostRequestReferenceWriting();
      writeHostRequestReference(
        {
          referenceData: formData,
        },
        {
          onSuccess: () => {
            setIsOpen(true);
          },
        }
      );
      window.scroll({ top: 0 });
    }
  };

  const redirectToHome = () => {
    router.push(`${baseRoute}`);
  };

  const onSubmit =
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? onFriendReferenceSubmit
      : onHostReferenceSubmit;

  return (
    <>
      {friendReferenceError ? (
        <Alert className={classes.alert} severity="error">
          {friendReferenceError.message}
        </Alert>
      ) : hostRequestReferenceError ? (
        <Alert className={classes.alert} severity="error">
          {hostRequestReferenceError.message}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <ReferenceStepHeader isSubmitStep />
        <ReferenceOverview referenceData={referenceData} />
        <div className={classes.buttonContainer}>
          <Button
            fullWidth={!isSmOrWider}
            type="submit"
            loading={isFriendReferenceLoading || isHostRequestReferenceLoading}
          >
            {t("global:submit")}
          </Button>
        </div>
      </form>
      <Dialog
        aria-labelledby={hostRequestReferenceSuccessDialogId}
        open={isOpen}
        onClose={redirectToHome}
      >
        <DialogTitle id={hostRequestReferenceSuccessDialogId}>
          {t("profile:leave_reference.reference_success")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("profile:leave_reference.host_request_reference_explanation")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={redirectToHome}>{t("global:ok")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
