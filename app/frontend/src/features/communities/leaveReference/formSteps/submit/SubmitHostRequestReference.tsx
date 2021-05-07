import Alert from "components/Alert";
import Button from "components/Button";
import { useWriteHostReference } from "features/communities/hooks";
import ReferenceOverview from "features/communities/leaveReference/formSteps/submit/ReferenceOverview";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/communities/leaveReference/ReferenceForm";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { WriteHostRequestReferenceInput } from "service/references";

export default function SubmitHostRequestReference({
  user,
  hostRequestId,
}: ReferenceFormProps) {
  const {
    writeHostRequestReference,
    status: writingStatus,
    reset: resetWriting,
  } = useWriteHostReference(user.userId);
  const classes = useReferenceStyles();
  const { data } = useData()!;
  const { handleSubmit } = useForm<typeof data>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = () => {
    if (hostRequestId !== undefined) {
      const formData: WriteHostRequestReferenceInput =
        data.wasAppropriate === "true"
          ? {
              hostRequestId: hostRequestId,
              wasAppropriate: true,
              text: data.text,
              rating: data.rating,
            }
          : {
              hostRequestId: hostRequestId,
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
      setErrorMessage("Host request id missing.");
    }
  };

  return (
    <>
      {writingStatus === "success" ? (
        <Alert className={classes.alert} severity="success">
          Successfully wrote the reference!
        </Alert>
      ) : writingStatus === "error" || errorMessage !== null ? (
        <Alert className={classes.alert} severity="error">
          {errorMessage || "Unknown error"}
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)}>
        <ReferenceOverview user={user} />
        <div className={classes.buttonContainer}>
          <Button type="submit">SUBMIT</Button>
        </div>
      </form>
    </>
  );
}
