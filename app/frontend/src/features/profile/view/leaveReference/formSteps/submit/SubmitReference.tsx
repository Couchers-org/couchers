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
import {
  HOST_REQUEST_REFERENCE_EXPLANATION,
  HOST_REQUEST_REFERENCE_SUCCESS_DIALOG,
  OKAY,
  REFERENCE_SUCCESS,
  SUBMIT,
} from "features/profile/constants";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "features/profile/hooks/referencesHooks";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceOverview from "features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import {
  ReferenceContextFormData,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { ReferenceType } from "proto/references_pb";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router";
import { baseRoute, referenceTypeRoute, routeToUser } from "routes";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

import ReferenceStepHeader from "../ReferenceStepHeader";

export interface SubmitReferenceProps {
  referenceData: ReferenceContextFormData;
}

export default function SubmitReference({
  referenceData,
}: SubmitReferenceProps) {
  const user = useProfileUser();
  const {
    writeFriendReference,
    reset: resetFriendReferenceWriting,
    error: friendReferenceError,
    isLoading: isFriendReferenceLoading,
  } = useWriteFriendReference(user.userId);
  const {
    writeHostRequestReference,
    reset: resetHostRequestReferenceWriting,
    error: hostRequestReferenceError,
    isLoading: isHostRequestReferenceLoading,
  } = useWriteHostReference(user.userId);

  const { referenceType, hostRequestId } = useParams<{
    referenceType: string;
    hostRequestId?: string;
  }>();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { handleSubmit } = useForm<ReferenceContextFormData>();

  const onFriendReferenceSubmit = () => {
    const formData: WriteFriendReferenceInput =
      referenceData.wasAppropriate === "true"
        ? {
            toUserId: user.userId,
            wasAppropriate: true,
            text: referenceData.text,
            rating: referenceData.rating,
          }
        : {
            toUserId: user.userId,
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
          history.push(routeToUser(user.username, "references"));
        },
      }
    );
    window.scroll({ top: 0 });
  };

  const onHostReferenceSubmit = () => {
    if (hostRequestId && !isNaN(+hostRequestId)) {
      const formData: WriteHostRequestReferenceInput =
        referenceData.wasAppropriate === "true"
          ? {
              hostRequestId: +hostRequestId,
              wasAppropriate: true,
              text: referenceData.text,
              rating: referenceData.rating,
            }
          : {
              hostRequestId: +hostRequestId,
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
    history.push(`${baseRoute}`);
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
            {SUBMIT}
          </Button>
        </div>
      </form>
      <Dialog
        aria-labelledby={HOST_REQUEST_REFERENCE_SUCCESS_DIALOG}
        open={isOpen}
        onClose={redirectToHome}
      >
        <DialogTitle id={HOST_REQUEST_REFERENCE_SUCCESS_DIALOG}>
          {REFERENCE_SUCCESS}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {HOST_REQUEST_REFERENCE_EXPLANATION}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={redirectToHome}>{OKAY}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
