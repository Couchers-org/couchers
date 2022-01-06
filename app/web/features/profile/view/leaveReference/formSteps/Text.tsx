import { useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import {
  NEXT,
  PUBLIC_ANSWER,
  REQUIRED,
  TEXT_EXPLANATION,
} from "features/profile/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { Controller, useForm } from "react-hook-form";
import {
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";

export default function Text({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const user = useProfileUser();
  const router = useRouter();
  const classes = useReferenceStyles();
  const theme = useTheme();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      text: referenceData.text,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[3]}`
        )
      : router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[3]}`
        );
  });

  return (
    <form className={classes.form} onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <TextBody className={classes.text}>{TEXT_EXPLANATION}</TextBody>
      <TextBody className={classes.text}>{PUBLIC_ANSWER}</TextBody>
      {errors.text?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.text.message}
        </Alert>
      )}
      <div className={classes.card}>
        <Controller
          render={({ onChange, value }) => (
            <TextField
              className="multiline"
              fullWidth={true}
              multiline={true}
              minRows={15}
              id="reference-text-input"
              onChange={(event) => onChange(event.target.value)}
              value={value}
            />
          )}
          name="text"
          control={control}
          rules={{ required: REQUIRED }}
          class={classes.card}
        />
      </div>
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
