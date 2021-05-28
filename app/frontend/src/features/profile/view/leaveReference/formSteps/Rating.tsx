import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import Markdown from "components/Markdown";
import RatingsSlider from "components/RatingsSlider/RatingsSlider";
import TextBody from "components/TextBody";
import {
  getRatingQuestion,
  NEXT,
  PRIVATE_ANSWER,
  RATING_EXPLANATION,
  RATING_HOW,
} from "features/profile/constants";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  steps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { ReferenceType } from "pb/references_pb";
//import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";

export default function Rating({
  user,
  referenceData,
  setReferenceValues,
}: ReferenceStepProps) {
  const history = useHistory();
  const classes = useReferenceStyles();
  const theme = useTheme();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      rating: referenceData.rating,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${steps[2]}`
        )
      : history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequest}/${steps[2]}`
        );
  });

  return (
    <form className={classes.form} onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <Typography variant="h3">{RATING_HOW}</Typography>
      <Markdown source={RATING_EXPLANATION} />
      <TextBody className={classes.text}>{PRIVATE_ANSWER}</TextBody>
      {errors && errors.rating?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.rating.message}
        </Alert>
      )}
      <Typography variant="h3" className={classes.text}>
        {getRatingQuestion(user.name)}
      </Typography>
      <Controller
        render={({ onChange }) => (
          <RatingsSlider
            onChange={onChange}
            defaultValue={referenceData.rating}
          />
        )}
        name="rating"
        control={control}
      />
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
