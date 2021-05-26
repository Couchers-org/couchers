import { Typography, useMediaQuery, useTheme } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import RatingsSlider from "components/RatingsSlider/RatingsSlider";
import TextBody from "components/TextBody";
import {
  getRatingQuestion,
  NEXT,
  PRIVATE_ANSWER,
  RATING_EXPLANATION,
  RATING_HOW,
  RATING_PROMPT,
  REFERENCE_FORM_HEADING_FRIEND,
  REFERENCE_FORM_HEADING_HOSTED,
  REFERENCE_FORM_HEADING_SURFED,
} from "features/profile/constants";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
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
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const { referenceType, hostRequest } = useParams<{
    referenceType: string;
    hostRequest?: string;
  }>();
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      rating: referenceData.rating,
    },
  });

  const onSubmit = (values: ReferenceContextFormData) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[0]
      ? history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/reference`
        )
      : history.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequest}/reference`
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
      <Typography variant="h3">{RATING_HOW}</Typography>
      <TextBody className={classes.text}>{RATING_EXPLANATION}</TextBody>
      <TextBody className={classes.text}>{RATING_PROMPT}</TextBody>
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
        <Button fullWidth={!isMdOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
