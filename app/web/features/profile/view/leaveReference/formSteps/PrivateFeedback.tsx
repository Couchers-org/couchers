import {
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  styled,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import RatingsSlider from "components/RatingsSlider/RatingsSlider";
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
  marginBottom: theme.spacing(4),
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

const StyledRatingQuestionText = styled(Typography)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const PrivateTextContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(1),
  width: "100%",
}));

export default function PrivateFeedback({
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
    watch,
  } = useForm<ReferenceContextFormData>({
    defaultValues: {
      wasAppropriate: referenceData.wasAppropriate,
      rating: referenceData.rating,
      privateText: referenceData.privateText,
    },
  });

  const { rating, wasAppropriate } = watch();

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    if (
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[2]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[2]}`,
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
          {errors && errors.rating?.message && (
            <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
              {errors.rating.message}
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
          <Typography variant="h3" sx={{ marginTop: 2 }}>
            {t("profile:leave_reference.rating_how")}
          </Typography>
          <Divider />
          <Markdown source={t("profile:leave_reference.rating_explanation")} />
          <StyledRatingQuestionText variant="h3">
            {t("profile:leave_reference.rating_question", { name: user.name })}
          </StyledRatingQuestionText>

          <Controller
            control={control}
            defaultValue={referenceData.rating}
            name="rating"
            render={({ field }) => (
              <RatingsSlider
                {...field}
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <StyledTextBody>
            {t("profile:leave_reference.private_answer")}
          </StyledTextBody>
        </CardContent>
      </StyledCard>
      {errors.privateText?.message && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
          {errors.privateText.message}
        </Alert>
      )}
      {(wasAppropriate === "false" || rating < 0.33) && (
        <PrivateTextContainer>
          <Typography variant="h3">
            {t("profile:leave_reference.private_text_header")}
          </Typography>
          <StyledTextBody>
            {t("profile:leave_reference.private_text_explanation")}
          </StyledTextBody>
          <Controller
            control={control}
            defaultValue={referenceData.privateText}
            name="privateText"
            render={({ field }) => (
              <TextField
                {...field}
                id="privateText"
                label={t("profile:leave_reference.private_text_placeholder")}
                error={!!errors.privateText}
                helperText={errors.privateText?.message}
                onChange={(event) => {
                  field.onChange(event);
                }}
                multiline
                minRows={3}
                sx={{
                  "& > .MuiInputBase-root": { width: "100%", marginTop: 1 },
                  marginTop: 2,
                }}
              />
            )}
          />
        </PrivateTextContainer>
      )}
      <StyledButtonContainer>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
}
