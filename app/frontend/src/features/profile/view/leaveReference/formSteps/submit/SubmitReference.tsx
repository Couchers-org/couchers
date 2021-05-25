import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { REFERENCE_SUCCESS, SUBMIT } from "features/profile/constants";
import {
  useWriteFriendReference,
  useWriteHostReference,
} from "features/profile/hooks/referencesHooks";
import ReferenceOverview from "features/profile/view/leaveReference/formSteps/submit/ReferenceOverview";
import { useReferenceData } from "features/profile/view/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import {
  WriteFriendReferenceInput,
  WriteHostRequestReferenceInput,
} from "service/references";

export default function SubmitReference({ user }: ReferenceFormProps) {
  const {
    writeFriendReference,
    status: friendReferenceWritingStatus,
    reset: resetFriendReferenceWriting,
  } = useWriteFriendReference(user.userId);
  const {
    writeHostRequestReference,
    status: hostRequestReferenceWritingStatus,
    reset: resetHostRequestReferenceWriting,
  } = useWriteHostReference(user.userId);

  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { data } = useReferenceData()!;
  const { handleSubmit } = useForm<typeof data>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFriendReferenceSubmit = () => {
    const formData: WriteFriendReferenceInput =
      data.wasAppropriate === "true"
        ? {
            toUserId: user.userId,
            wasAppropriate: true,
            text: data.text,
            rating: data.rating,
          }
        : {
            toUserId: user.userId,
            wasAppropriate: false,
            text: data.text,
            rating: data.rating,
          };

    resetFriendReferenceWriting();
    writeFriendReference({
      referenceData: formData,
    });
    window.scroll({ top: 0 });
  };

  const onHostReferenceSubmit = () => {
    if (hostRequest && +hostRequest !== undefined) {
      const formData: WriteHostRequestReferenceInput =
        data.wasAppropriate === "true"
          ? {
              hostRequestId: +hostRequest,
              wasAppropriate: true,
              text: data.text,
              rating: data.rating,
            }
          : {
              hostRequestId: +hostRequest,
              wasAppropriate: false,
              text: data.text,
              rating: data.rating,
            };

      resetHostRequestReferenceWriting();
      writeHostRequestReference({
        referenceData: formData,
      });
      window.scroll({ top: 0 });
    } else {
      setErrorMessage("Error fetching the host request.");
    }
  };

  let onSubmit = onHostReferenceSubmit;
  if (referenceType === "friend") {
    onSubmit = onFriendReferenceSubmit;
  }

  return (
    <>
      {(friendReferenceWritingStatus || hostRequestReferenceWritingStatus) ===
      "success" ? (
        <Alert className={classes.alert} severity="success">
          {REFERENCE_SUCCESS}
        </Alert>
      ) : (friendReferenceWritingStatus ||
          hostRequestReferenceWritingStatus) === "error" ||
        errorMessage !== null ? (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <ReferenceOverview user={user} />
        <div className={classes.buttonContainer}>
          <Button fullWidth={!isMdOrWider} type="submit">
            {SUBMIT}
          </Button>
        </div>
      </form>
    </>
  );
}
