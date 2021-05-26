import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import {
  NEXT,
  PUBLIC_ANSWER,
  REFERENCE_FORM_HEADING_FRIEND,
  REFERENCE_FORM_HEADING_HOSTED,
  REFERENCE_FORM_HEADING_SURFED,
  TEXT_EXPLANATION,
} from "features/profile/constants";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";

export default function Text({
  user,
  referenceData,
  setReferenceValues,
}: ReferenceStepProps) {
  const history = useHistory();
  const classes = useReferenceStyles();
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      text: referenceData.text,
    },
  });

  const onSubmit = (values: ReferenceContextFormData) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[0]
      ? history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/submit`
        )
      : history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequest}/submit`
        );
  };

  return (
    <form className={classes.form} onSubmit={handleSubmit(onSubmit)}>
      {referenceType === referenceTypeRoute[0] && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_FRIEND}
          {user.name}
        </Typography>
      )}
      {referenceType === referenceTypeRoute[2] && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_HOSTED}
          {user.name}
        </Typography>
      )}
      {referenceType === referenceTypeRoute[1] && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_SURFED}
          {user.name}
        </Typography>
      )}
      <TextBody className={classes.text}>{TEXT_EXPLANATION}</TextBody>
      <TextBody className={classes.text}>{PUBLIC_ANSWER}</TextBody>
      {errors && errors.text?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.text.message}
        </Alert>
      )}
      <div className={classes.card}>
        <Controller
          render={({ onChange }) => (
            <TextField
              className="multiline"
              fullWidth={true}
              multiline={true}
              rows={15}
              id="reference-text-input"
              onChange={onChange}
            />
          )}
          name="text"
          control={control}
          class={classes.card}
        />
      </div>
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isMdOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
