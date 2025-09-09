import { Typography, styled, useMediaQuery } from "@mui/material";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { Trans } from "react-i18next";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import StyledLink from "@/components/StyledLink";
import TextBody from "@/components/TextBody";
import TextField from "@/components/TextField";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import {
  ReferenceContextFormData,
  ReferenceStepProps,
} from "@/features/profile/view/leaveReference/ReferenceForm";
import ReferenceStepHeader from "@/features/profile/view/leaveReference/formSteps/ReferenceStepHeader";
import { useTranslation } from "@/i18n";
import { PROFILE } from "@/i18n/namespaces";
import { ReferenceType } from "@/proto/references_pb";
import {
  HELP_CENTER_HOW_TO_LEAVE_GOOD_REFERENCE_URL,
  LEAVE_REFERENCE_BASE_ROUTE,
  REFERENCE_STEP_STRINGS,
  REFERENCE_TYPE_ROUTE,
} from "@/routes";
import { theme } from "@/theme";

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

const Text = ({
  referenceData,
  setReferenceValues,
  referenceType,
  hostRequestId,
}: ReferenceStepProps) => {
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

  const onSubmit = () =>
    handleSubmit((values) => {
      setReferenceValues(values);
      if (
        referenceType ===
        REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
      ) {
        void router.push(
          `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${user.userId}/${REFERENCE_STEP_STRINGS[3]}`,
        );
      } else {
        // TODO(FB) Handle undefined hostRequestId properly
        void router.push(
          `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${user.userId}/${hostRequestId ?? ""}/${REFERENCE_STEP_STRINGS[3]}`,
        );
      }
    });

  return (
    <StyledForm onSubmit={onSubmit}>
      <ReferenceStepHeader name={user.name} referenceType={referenceType} />
      <StyledTextBody>
        {t("profile:leave_reference.text_explanation")}
      </StyledTextBody>
      <StyledTextBody sx={{ marginTop: theme.spacing(2) }}>
        {referenceType !==
        REFERENCE_TYPE_ROUTE[ReferenceType.REFERENCE_TYPE_FRIEND]
          ? t("profile:leave_reference.text_explanation_hosted_surfed", {
              name: user.name,
            })
          : t("profile:leave_reference.public_answer")}
      </StyledTextBody>
      <Typography variant="h3" sx={{ marginTop: theme.spacing(3) }}>
        {t("profile:leave_reference.add_a_reference", {
          name: user.name,
        })}
      </Typography>
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
              placeholder={t("profile:leave_reference.text_label")}
              fullWidth={true}
              multiline={true}
              minRows={15}
              id="reference-text-input"
              onChange={(event) => {
                field.onChange(event.target.value);
              }}
              value={field.value}
            />
          )}
          name="text"
          control={control}
          rules={{ required: t("profile:leave_reference.required") }}
        />
      </StyledCard>
      <Typography sx={{ marginTop: theme.spacing(3) }}>
        <Trans
          i18nKey="profile:leave_reference.by_writing_thoughtful"
          components={{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            1: (
              <StyledLink href={HELP_CENTER_HOW_TO_LEAVE_GOOD_REFERENCE_URL} />
            ),
          }}
        />
      </Typography>
      <StyledButtonContainer>
        <Button fullWidth={!isSmOrWider} type="submit">
          {t("profile:leave_reference.next_step_label")}
        </Button>
      </StyledButtonContainer>
    </StyledForm>
  );
};

export default Text;
