import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { REFERENCE_SUCCESS, SUBMIT } from "features/communities/constants";
import { useWriteFriendReference } from "features/communities/hooks";
import ReferenceOverview from "features/communities/leaveReference/formSteps/submit/ReferenceOverview";
import { useReferenceData } from "features/communities/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/communities/leaveReference/ReferenceForm";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { WriteFriendReferenceInput } from "service/references";

import classes from "*.module.css";

export default function SubmitFriendReference({ user }: ReferenceFormProps) {
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const {
    writeFriendReference,
    status: writingStatus,
    reset: resetWriting,
  } = useWriteFriendReference(user.userId);

  const { data } = useReferenceData()!;
  const { handleSubmit } = useForm<typeof data>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = () => {
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

    resetWriting();
    writeFriendReference({
      referenceData: formData,
      setMutationError: setErrorMessage,
    });
    window.scroll({ top: 0 });
  };

  return (
    <>
      {writingStatus === "success" ? (
        <Alert className={classes.alert} severity="success">
          {REFERENCE_SUCCESS}
        </Alert>
      ) : writingStatus === "error" || errorMessage !== null ? (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
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
