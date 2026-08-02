import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";

interface ChangePasswordVariables {
  oldPassword: string;
  newPassword: string;
}

interface ChangePasswordFormData extends ChangePasswordVariables {
  passwordConfirmation: string;
}

interface ChangePasswordProps {
  className?: string;
}

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

export default function ChangePassword({ className }: ChangePasswordProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    getValues,
    handleSubmit,
    reset: resetForm,
    register,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    mode: "onBlur",
  });
  const onSubmit = handleSubmit(({ oldPassword, newPassword }) => {
    changePassword({ oldPassword, newPassword });
  });

  const queryClient = useQueryClient();
  const {
    error: changePasswordError,
    isPending: isChangePasswordLoading,
    isSuccess: isChangePasswordSuccess,
    mutate: changePassword,
  } = useMutation<Empty, RpcError, ChangePasswordVariables>({
    mutationFn: ({ oldPassword, newPassword }) => service.account.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">{t("auth:change_password_form.title")}</Typography>
      {changePasswordError && <Alert severity="error">{changePasswordError.message}</Alert>}
      {isChangePasswordSuccess && (
        <Alert severity="success">{t("auth:change_password_form.password_changed_success")}</Alert>
      )}
      <StyledForm onSubmit={onSubmit}>
        <TextField
          {...register("oldPassword", { required: true })}
          id="oldPassword"
          label={t("auth:change_password_form.old_password")}
          type={showOldPassword ? "text" : "password"}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ marginRight: 1 }}>
                  <IconButton
                    aria-label={
                      showOldPassword
                        ? t("auth:change_password_form.hide_old_password")
                        : t("auth:change_password_form.show_old_password")
                    }
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          id="newPassword"
          {...register("newPassword", { required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type={showNewPassword ? "text" : "password"}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ marginRight: 1 }}>
                  <IconButton
                    aria-label={
                      showNewPassword
                        ? t("auth:change_password_form.hide_new_password")
                        : t("auth:change_password_form.show_new_password")
                    }
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          id="passwordConfirmation"
          {...register("passwordConfirmation", {
            validate: (value) =>
              value === getValues("newPassword") || t("auth:change_password_form.password_mismatch_error"),
          })}
          label={t("auth:change_password_form.confirm_password")}
          fullWidth
          type={showConfirmPassword ? "text" : "password"}
          helperText={errors.passwordConfirmation?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ marginRight: 1 }}>
                  <IconButton
                    aria-label={
                      showConfirmPassword
                        ? t("auth:change_password_form.hide_confirm_password")
                        : t("auth:change_password_form.show_confirm_password")
                    }
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button fullWidth={!isMdOrWider} loading={isChangePasswordLoading} type="submit">
          {t("global:submit")}
        </Button>
      </StyledForm>
    </div>
  );
}
