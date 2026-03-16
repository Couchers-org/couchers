import { styled, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { accountInfoQueryKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

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
  const isMobile = useIsScreenSizeOrSmaller("mobile");

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
          fullWidth={isMobile}
        />
        <TextField
          id="newPassword"
          {...register("newPassword", { required: true })}
          label={t("auth:change_password_form.new_password")}
          name="newPassword"
          type="password"
          fullWidth={isMobile}
        />
        <TextField
          id="passwordConfirmation"
          {...register("passwordConfirmation", {
            validate: (value) =>
              value === getValues("newPassword") ||
              t("auth:change_password_form.password_mismatch_error"),
          })}
          label={t("auth:change_password_form.confirm_password")}
          fullWidth={isMobile}
          type="password"
          helperText={errors.passwordConfirmation?.message}
        />
        <Button
          fullWidth={isMobile}
          loading={isChangePasswordLoading}
          type="submit"
        >
          {t("global:submit")}
        </Button>
      </StyledForm>
    </div>
  );
}
