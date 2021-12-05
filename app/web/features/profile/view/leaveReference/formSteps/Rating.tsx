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
  REFERENCE_STEP,
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
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";

export default function Rating({
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
      rating: referenceData.rating,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${REFERENCE_STEP}`
        )
      : router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${REFERENCE_STEP}`
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
        control={control}
        defaultValue={referenceData.rating}
        name="rating"
        render={({ onChange, value }) => (
          <RatingsSlider onChange={onChange} value={value} />
        )}
      />
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
