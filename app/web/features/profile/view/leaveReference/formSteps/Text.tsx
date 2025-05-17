import { styled, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import TextField from "components/TextField";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import ReferenceStepHeader from "features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
} from "features/profile/view/leaveReference/ReferenceForm";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
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

const StyledCard = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(1),
}));

export default function Text({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) {
  const { t } = useTranslation([PROFILE]);
  const user = useProfileUser();
  const router = useRouter();
  const isSmOrWider = useMediaQuery(theme.breakpoints.up("sm"));
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferenceContextFormData>({
    defaultValues: {
      text: referenceData.text,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setReferenceValues(values);
    if (
      referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
    ) {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${referenceStepStrings[3]}`,
      );
    } else {
      router.push(
        `${leaveReferenceBaseRoute}/${referenceType}/${user.userId}/${hostRequestId}/${referenceStepStrings[3]}`,
      );
    }
  });

  return (
    <StyledForm onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <StyledTextBody>
        {t("profile:leave_reference.text_explanation")}
      </StyledTextBody>
      <StyledTextBody>
        {t("profile:leave_reference.public_answer")}
      </StyledTextBody>
      {errors.text?.message && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(3) }}>
          {errors.text.message}
        </Alert>
      )}
      <StyledCard>
        <Controller
          render={({ field }) => (
            <TextField
              {...field}
              className="multiline"
              fullWidth={true}
              multiline={true}
              minRows={15}
              id="reference-text-input"
              onChange={(event) => field.onChange(event.target.value)}
              value={field.value}
            />
          )}
          name="text"
          control={control}
          rules={{ required: t("profile:leave_reference.required") }}
        />
      </StyledCard>
      <StyledButtonContainer>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
}
