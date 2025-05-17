import {
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import TextBody from "components/TextBody";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
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
import { theme } from "theme";

const StyledForm = styled("form")(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledTextBody = styled(TextBody)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const StyledAppropriateQuestionText = styled(Typography)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

export default function Appropriate({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const router = useRouter();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferenceContextFormData>({
    defaultValues: {
      wasAppropriate: referenceData.wasAppropriate,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    if (
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[1]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[1]}`,
      );
    }
  });

  return (
    <StyledForm onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <StyledTextBody>
        {t("profile:leave_reference.appropriate_explanation")}
      </StyledTextBody>
      <StyledCard>
        <CardContent>
          <Typography variant="h3">
            {t("profile:leave_reference.appropriate_behavior")}
          </Typography>
          <Divider />
          <StyledTextBody>
            {t("profile:leave_reference.safety_priority")}
          </StyledTextBody>
          {errors.wasAppropriate?.message && (
            <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
              {errors.wasAppropriate.message}
            </Alert>
          )}
          <StyledAppropriateQuestionText variant="h3">
            {t("profile:leave_reference.appropriate_question")}
          </StyledAppropriateQuestionText>
          <Controller
            render={({ field }) => (
              <RadioGroup {...field} aria-label="wasAppropriate">
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
            )}
            name="wasAppropriate"
            control={control}
            rules={{
              required: t("profile:leave_reference.was_appropriate_required"),
            }}
          />
          <StyledTextBody>
            {t("profile:leave_reference.private_answer")}
          </StyledTextBody>
        </CardContent>
      </StyledCard>
      <StyledButtonContainer>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
}
