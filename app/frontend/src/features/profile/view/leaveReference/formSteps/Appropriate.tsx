import {
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import TextBody from "components/TextBody";
import {
  APPROPRIATE_BEHAVIOR,
  APPROPRIATE_EXPLANATION,
  APPROPRIATE_QUESTION,
  NEXT,
  PRIVATE_ANSWER,
  REFERENCE_FORM_HEADING_FRIEND,
  REFERENCE_FORM_HEADING_HOSTED,
  REFERENCE_FORM_HEADING_SURFED,
  SAFETY_PRIORITY,
} from "features/profile/constants";
import {
  ReferenceContextFormData,
  useReferenceData,
} from "features/profile/view/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { leaveReferenceBaseRoute } from "routes";

export default function Appropriate({ user }: ReferenceFormProps) {
  const history = useHistory();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const { data, setValues } = useReferenceData()!;
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      wasAppropriate: data.wasAppropriate,
    },
  });

  const onSubmit = (values: ReferenceContextFormData) => {
    setValues(values);
    history.push(
      `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequest}/rating`
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      {referenceType === "friend" && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_FRIEND}
          {user.name}
        </Typography>
      )}
      {referenceType === "hosted" && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_HOSTED}
          {user.name}
        </Typography>
      )}
      {referenceType === "surfed" && (
        <Typography variant="h2">
          {REFERENCE_FORM_HEADING_SURFED}
          {user.name}
        </Typography>
      )}
      <TextBody className={classes.text}>{APPROPRIATE_EXPLANATION}</TextBody>
      <TextBody className={classes.text}>{PRIVATE_ANSWER}</TextBody>
      {errors && errors.wasAppropriate?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.wasAppropriate.message}
        </Alert>
      )}
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h3">{APPROPRIATE_BEHAVIOR}</Typography>
          <Divider />
          <TextBody className={classes.text}>{SAFETY_PRIORITY}</TextBody>
          <Typography variant="h3" className={classes.text}>
            {APPROPRIATE_QUESTION}
          </Typography>
          <Controller
            as={
              <RadioGroup aria-label="wasAppropriate">
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label="Yes"
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label="No"
                />
              </RadioGroup>
            }
            name="wasAppropriate"
            control={control}
          />
        </CardContent>
      </Card>
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isMdOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
