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
  REQUIRED,
  SAFETY_PRIORITY,
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

export default function Appropriate({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const user = useProfileUser();
  const router = useRouter();
  const theme = useTheme();
  const classes = useReferenceStyles();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const { control, handleSubmit, errors } = useForm<ReferenceContextFormData>({
    defaultValues: {
      wasAppropriate: referenceData.wasAppropriate,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
      ? router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[1]}`
        )
      : router.push(
          `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[1]}`
        );
  });

  return (
    <form onSubmit={onSubmit} className={classes.form}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <TextBody className={classes.text}>{APPROPRIATE_EXPLANATION}</TextBody>

      {errors.wasAppropriate?.message && (
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
            rules={{ required: REQUIRED }}
          />
          <TextBody className={classes.text}>{PRIVATE_ANSWER}</TextBody>
        </CardContent>
      </Card>
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {NEXT}
        </Button>
      </div>
    </form>
  );
}
