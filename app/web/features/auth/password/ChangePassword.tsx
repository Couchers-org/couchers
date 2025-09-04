import { Typography, styled, useMediaQuery, useTheme } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useForm } from "react-hook-form";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { accountInfoQueryKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { AUTH, GLOBAL } from "@/i18n/namespaces";
import { service } from "@/service";
import { theme } from "@/theme";

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

const StyledForm = styled("form")(() => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

export default function ChangePassword({ className }: ChangePasswordProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const theme = useTheme();
  const isMdOrWider = useMediaQuery(theme.breakpoints.up("md"));

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
    mutationFn: ({ oldPassword, newPassword }) =>
      service.account.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [accountInfoQueryKey],
      });
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("auth:change_password_form.title")}
      </Typography>
      {changePasswordError && (
        <Alert severity="error">{changePasswordError.message}</Alert>
      )}
      {isChangePasswordSuccess && (
        <Alert severity="success">
          {t("auth:change_password_form.password_changed_success")}
        </Alert>
      )}
      <StyledForm onSubmit={onSubmit}>
        <TextField
          {...register("oldPassword", { required: true })}
          id="oldPassword"
          label={t("auth:change_password_form.old_password")}
          type="password"
          fullWidth={!isMdOrWider}
        />
        <TextField
          id="newPassword"
          {...register("newPassword", { required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type="password"
          fullWidth={!isMdOrWider}
        />
        <TextField
          id="passwordConfirmation"
          {...register("passwordConfirmation", {
            validate: (value) =>
              value === getValues("newPassword") ||
              t("auth:change_password_form.password_mismatch_error"),
          })}
          label={t("auth:change_password_form.confirm_password")}
          fullWidth={!isMdOrWider}
          type="password"
          helperText={errors.passwordConfirmation?.message}
        />
        <Button
          fullWidth={!isMdOrWider}
          loading={isChangePasswordLoading}
          type="submit"
        >
          {t("global:submit")}
        </Button>
      </StyledForm>
    </div>
  );
}
