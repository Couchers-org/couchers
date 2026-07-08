import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { lowercaseAndTrimField } from "utils/validation";

const StyledForm = styled("form")(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    width: "15.5rem",
  },
}));

interface ChangeEmailFormData {
  newEmail: string;
  currentPassword: string;
}

interface ChangeEmailProps {
  email: string;
  className?: string;
}

export default function ChangeEmail({ className, email }: ChangeEmailProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<ChangeEmailFormData>();
  const onSubmit = handleSubmit(({ currentPassword, newEmail }) => {
    changeEmail({ currentPassword, newEmail: lowercaseAndTrimField(newEmail) });
  });

  const {
    error: changeEmailError,
    isPending: isChangeEmailLoading,
    isSuccess: isChangeEmailSuccess,
    mutate: changeEmail,
  } = useMutation<Empty, RpcError, ChangeEmailFormData>({
    mutationFn: ({ currentPassword, newEmail }) =>
      service.account.changeEmail(newEmail, currentPassword),
    onSuccess: () => {
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_email_form.title")}</Typography>
      <>
        <Typography variant="body1">
          <Trans
            i18nKey="auth:change_email_form.current_email_message"
            values={{ email }}
            components={{ 1: <strong /> }}
          />
        </Typography>
        {changeEmailError && (
          <Alert severity="error">{changeEmailError.message}</Alert>
        )}
        {isChangeEmailSuccess && (
          <Alert severity="success">
            {t("auth:change_email_form.success_message")}
          </Alert>
        )}
        <StyledForm onSubmit={onSubmit}>
          <TextField
            id="currentPassword"
            {...register("currentPassword", { required: true })}
            label={t("auth:change_email_form.current_password")}
            type={showPassword ? "text" : "password"}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ marginRight: 1 }}>
                    <IconButton
                      aria-label={
                        showPassword
                          ? t("auth:change_email_form.hide_current_password")
                          : t("auth:change_email_form.show_current_password")
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            id="newEmail"
            {...register("newEmail", { required: true })}
            label={t("auth:change_email_form.new_email")}
            name="newEmail"
            fullWidth
          />
          <Button
            fullWidth={!isMdOrWider}
            loading={isChangeEmailLoading}
            type="submit"
          >
            {t("global:submit")}
          </Button>
        </StyledForm>
      </>
    </div>
  );
}
