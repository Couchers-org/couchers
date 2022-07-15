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
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
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
  const { t } = useTranslation([GLOBAL, PROFILE]);
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
      <TextBody className={classes.text}>
        {t("profile:leave_reference.appropriate_explanation")}
      </TextBody>

      {errors.wasAppropriate?.message && (
        <Alert className={classes.alert} severity="error">
          {errors.wasAppropriate.message}
        </Alert>
      )}
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h3">
            {t("profile:leave_reference.appropriate_behavior")}
          </Typography>
          <Divider />
          <TextBody className={classes.text}>
            {t("profile:leave_reference.safety_priority")}
          </TextBody>
          <Typography variant="h3" className={classes.text}>
            {t("profile:leave_reference.appropriate_question")}
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
            rules={{
              required: t("profile:leave_reference.was_appropriate_required"),
            }}
          />
          <TextBody className={classes.text}>
            {t("profile:leave_reference.private_answer")}
          </TextBody>
        </CardContent>
      </Card>
      <div className={classes.buttonContainer}>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </div>
    </form>
  );
}
