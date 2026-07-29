import {
  Box,
  Checkbox,
  FormControlLabel,
  styled,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { useAuthContext } from "features/auth/AuthProvider";
import { StyledButton, StyledForm } from "features/auth/useAuthStyles";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";

const MOTIVATION_OPTIONS = [
  "surfing",
  "hosting",
  "events",
  "community_organizing",
  "something_else",
] as const;

type MotivationKey = (typeof MOTIVATION_OPTIONS)[number];

type MotivationsFormInputs = Record<MotivationKey, boolean>;

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  alignItems: "flex-start",
  marginBottom: theme.spacing(1),
  "& .MuiCheckbox-root": {
    paddingTop: theme.spacing(0.5),
  },
}));

export default function MotivationsForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions, authState } = useAuthContext();

  const { control, handleSubmit } = useForm<MotivationsFormInputs>({
    defaultValues: {
      surfing: false,
      hosting: false,
      events: false,
      community_organizing: false,
      something_else: false,
    },
  });

  const mutation = useMutation<void, RpcError, MotivationsFormInputs>({
    mutationFn: async (data) => {
      const selectedMotivations = MOTIVATION_OPTIONS.filter((key) => data[key]);
      const state = await service.auth.signupFlowMotivations(
        authState.flowState!.flowToken,
        selectedMotivations,
      );
      authActions.updateSignupState(state);
    },
    onMutate() {
      authActions.clearError();
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });

  const submit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <StyledForm onSubmit={submit}>
        {MOTIVATION_OPTIONS.map((key) => (
          <Controller
            key={key}
            name={key}
            control={control}
            render={({ field }) => (
              <StyledFormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                }
                label={
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      {t(`auth:motivations_form.${key}`)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {t(`auth:motivations_form.${key}_description`)}
                    </Typography>
                  </Box>
                }
              />
            )}
          />
        ))}
        <StyledButton
          onClick={submit}
          type="submit"
          loading={authState.loading || mutation.isPending}
          fullWidth
        >
          {t("global:continue")}
        </StyledButton>
      </StyledForm>
    </>
  );
}
