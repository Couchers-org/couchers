import {
  Card,
  CardContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  styled,
  Typography,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import Divider from "components/Divider";
import RatingsSlider from "components/RatingsSlider/RatingsSlider";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
} from "features/profile/view/leaveReference/ReferenceForm";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { ReferenceType } from "proto/references_pb";
import { Controller, useForm } from "react-hook-form";
import {
  helpCenterPrivateFeedbackUrl,
  leaveReferenceBaseRoute,
  referenceStepStrings,
  referenceTypeRoute,
} from "routes";
import { theme } from "theme";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

const ACCEPTABLE_RATING_THRESHOLD = 0.33;

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

const PrivateTextContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(3),
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
  const isMobile = useIsScreenSizeOrSmaller("mobile");

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

  const hasProvidedAcceptableExperience = !(
    wasAppropriate === "false" ||
    (rating !== undefined && rating < ACCEPTABLE_RATING_THRESHOLD)
  );

  return (
    <StyledForm onSubmit={onSubmit}>
      <ReferenceStepHeader
        name={user.name}
        referenceType={referenceType}
        step="private-feedback"
      />
      <StyledTextBody>
        {t("profile:leave_reference.appropriate_explanation")}
      </StyledTextBody>
      <Alert severity="warning" sx={{ margin: theme.spacing(3, 0) }}>
        {t("profile:leave_reference.private_answer")}
      </Alert>
      <StyledCard>
        <CardContent>
          <StyledAppropriateQuestionText variant="h3">
            {t("profile:leave_reference.appropriate_question")}
          </StyledAppropriateQuestionText>
          <Divider />
          {errors.wasAppropriate?.message && (
            <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
              {errors.wasAppropriate.message}
            </Alert>
          )}
          <Controller
            render={({ field }) => (
              <RadioGroup {...field} aria-label="wasAppropriate">
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label={t("profile:leave_reference.yes_safe")}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label={t("profile:leave_reference.no_not_safe")}
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
            {t("profile:leave_reference.rating_how", {
              name: user.name,
            })}
          </Typography>
          <Divider />
          {errors && errors.rating?.message && (
            <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
              {errors.rating.message}
            </Alert>
          )}
          <Controller
            control={control}
            defaultValue={referenceData.rating}
            name="rating"
            render={({ field }) => (
              <RatingsSlider onChange={field.onChange} value={field.value} />
            )}
            rules={{
              required: t("profile:leave_reference.rating_required"),
            }}
          />
          {errors.privateText?.message && (
            <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
              {errors.privateText.message}
            </Alert>
          )}
          {!hasProvidedAcceptableExperience && (
            <PrivateTextContainer>
              <Typography sx={{ marginTop: theme.spacing(2) }}>
                {t("profile:leave_reference.private_text_explanation_1")}
              </Typography>
              <Typography sx={{ marginTop: theme.spacing(2) }}>
                <Trans i18nKey="profile:leave_reference.private_text_explanation_2">
                  This will only be seen by our Safety Team and will stay
                  private. The more details the better, but even a short
                  explanation can help a lot. Read more{" "}
                  <StyledLink
                    href={helpCenterPrivateFeedbackUrl}
                    sx={{ fontWeight: 600 }}
                  >
                    here
                  </StyledLink>
                  .
                </Trans>
              </Typography>
              <Typography sx={{ marginTop: theme.spacing(2) }}>
                {t("profile:leave_reference.private_text_explanation_3")}
              </Typography>
              <Typography variant="h3" sx={{ marginTop: theme.spacing(4) }}>
                {t("profile:leave_reference.what_happened")}
              </Typography>
              <Controller
                control={control}
                defaultValue={referenceData.privateText}
                name="privateText"
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="privateText"
                    label={t(
                      "profile:leave_reference.private_text_placeholder",
                    )}
                    error={!!errors.privateText}
                    helperText={errors.privateText?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                    multiline
                    minRows={3}
                    slotProps={{
                      inputLabel: {
                        sx: {
                          whiteSpace: "normal",
                          lineHeight: 1.2,
                          "&.MuiInputLabel-shrink": {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "calc(133% - 32px)",
                          },
                        },
                      },
                    }}
                    sx={{
                      "& > .MuiInputBase-root": {
                        width: "100%",
                        marginTop: 1,
                      },
                      marginTop: 2,
                    }}
                  />
                )}
              />
            </PrivateTextContainer>
          )}
        </CardContent>
      </StyledCard>

      <StyledButtonContainer>
        <Button fullWidth={isMobile} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
}
