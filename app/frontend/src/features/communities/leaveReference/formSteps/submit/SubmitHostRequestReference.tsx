import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { REFERENCE_SUCCESS, SUBMIT } from "features/communities/constants";
import { useWriteHostReference } from "features/communities/hooks";
import ReferenceOverview from "features/communities/leaveReference/formSteps/submit/ReferenceOverview";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/communities/leaveReference/ReferenceForm";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { WriteHostRequestReferenceInput } from "service/references";

export default function SubmitHostRequestReference({
  user,
}: ReferenceFormProps) {
  const {
    writeHostRequestReference,
    status: writingStatus,
    reset: resetWriting,
  } = useWriteHostReference(user.userId);
  const { hostRequest } = useParams<{
    hostRequest: string;
  }>();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { data } = useData()!;
  const { handleSubmit } = useForm<typeof data>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = () => {
    if (+hostRequest !== undefined) {
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

      resetWriting();
      writeHostRequestReference({
        referenceData: formData,
        setMutationError: setErrorMessage,
      });
      window.scroll({ top: 0 });
    } else {
      setErrorMessage("Error fetching the host request.");
    }
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
