import { styled, Typography, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
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

const StyledRatingQuestionText = styled(Typography)(({ theme }) => ({
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

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

export default function Rating({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const user = useProfileUser();
  const router = useRouter();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferenceContextFormData>({
    defaultValues: {
      rating: referenceData.rating,
    },
  });

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
      <Typography variant="h3">
        {t("profile:leave_reference.rating_how")}
      </Typography>
      <Markdown source={t("profile:leave_reference.rating_explanation")} />
      <StyledTextBody>
        {t("profile:leave_reference.private_answer")}
      </StyledTextBody>
      {errors && errors.rating?.message && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
          {errors.rating.message}
        </Alert>
      )}
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
      <StyledButtonContainer>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
}
