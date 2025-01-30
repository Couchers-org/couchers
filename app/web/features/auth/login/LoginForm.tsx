import { FormControlLabel } from "@mui/material";
import { styled } from "@mui/styles";
import CustomColorSwitch from "components/CustomColorSwitch";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import Sentry from "platform/sentry";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { resetPasswordRoute } from "routes";
import isGrpcError from "service/utils/isGrpcError";
import { lowercaseAndTrimField } from "utils/validation";

import {
  StyledButton,
  StyledForm,
  StyledInputLabel,
  StyledTextField,
} from "../useAuthStyles";

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  display: "block",
  marginInlineStart: 0,
  [theme.breakpoints.down("md")]: {
    marginBlockEnd: theme.spacing(1),
  },
}));

const StyledLoginOptions = styled("div")(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    alignItems: "center",
    display: "flex",
    marginTop: theme.spacing(2),
    justifyContent: "space-between",
    width: "100%",
  },
}));

export default function LoginForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState, authActions } = useAuthContext();
  const authLoading = authState.loading;
  const [loading, setLoading] = useState(false);

  const { handleSubmit, register, control } = useForm<{
    username: string;
    password: string;
    rememberDevice: boolean;
  }>();

  const onSubmit = handleSubmit(
    async (data: {
      username: string;
      password: string;
      rememberDevice: boolean;
    }) => {
      setLoading(true);
      authActions.clearError();
      try {
        authActions.passwordLogin({
          username: lowercaseAndTrimField(data.username),
          password: data.password,
          rememberDevice: data.rememberDevice,
        });
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            featureArea: "auth/login",
          },
        });
        authActions.authError(
          isGrpcError(e) ? e.message : t("global:error.fatal_message"),
        );
      }
      setLoading(false);
    },
  );

  return (
    <>
      <StyledForm onSubmit={onSubmit}>
        <StyledInputLabel htmlFor="username">
          {t("auth:login_page.form.username_field_label")}
        </StyledInputLabel>
        <StyledTextField
          id="username"
          {...register("username", { required: true })}
          fullWidth
          variant="standard"
          autoComplete="username"
        />
        <StyledInputLabel htmlFor="password">
          {t("auth:login_page.form.password_field_label")}
        </StyledInputLabel>
        <StyledTextField
          id="password"
          {...register("password", { required: true })}
          fullWidth
          name="password"
          type="password"
          variant="standard"
          autoComplete="current-password"
        />
        <StyledLoginOptions>
          <Controller
            control={control}
            name="rememberDevice"
            defaultValue={true}
            render={({ field }) => (
              <StyledFormControlLabel
                control={
                  <CustomColorSwitch
                    size="small"
                    checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    isLoading={loading}
                  />
                }
                label={t("auth:login_page.form.remember_me")}
              />
            )}
          />
          <StyledLink href={resetPasswordRoute}>
            {t("auth:login_page.form.forgot_password")}
          </StyledLink>
        </StyledLoginOptions>
        <StyledButton
          loading={loading || authLoading}
          onClick={onSubmit}
          type="submit"
          variant="contained"
        >
          {t("global:continue")}
        </StyledButton>
      </StyledForm>
    </>
  );
}
