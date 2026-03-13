import { styled, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";
import useIsMobile from "utils/useIsMobile";
import { lowercaseAndTrimField } from "utils/validation";

const StyledForm = styled("form")(() => ({
  marginBottom: theme.spacing(2),
  "& > * + *": {
    marginBlockStart: theme.spacing(1),
  },
}));

interface DeleteAccountForm {
  confirmUsername: string;
  reason?: string;
}

interface DeleteAccountProps {
  username: string;
  className?: string;
}

export default function DeleteAccount({
  className,
  username,
}: DeleteAccountProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const isMobile = useIsMobile();

  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<DeleteAccountForm>();
  const onSubmit = handleSubmit((data) => {
    deleteAccount(data);
  });

  const {
    error: deleteAccountError,
    isPending: isDeleteAccountLoading,
    isSuccess: isDeleteAccountSuccess,
    mutate: deleteAccount,
  } = useMutation<Empty, RpcError, DeleteAccountForm>({
    mutationFn: ({ confirmUsername, reason }) => {
      const confirm =
        lowercaseAndTrimField(confirmUsername) ===
        lowercaseAndTrimField(username);
      if (!confirm) {
        throw Error(t("auth:delete_account.request.username_mismatch"));
      }
      return service.account.deleteAccount(confirm, reason);
    },
    onSuccess: () => {
      resetForm();
    },
  });

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("auth:delete_account.request.title")}
      </Typography>
      <>
        <Typography variant="body1">
          {t("auth:delete_account.request.description")}
        </Typography>
        {deleteAccountError && (
          <Alert severity="error">{deleteAccountError.message}</Alert>
        )}
        {isDeleteAccountSuccess && (
          <Alert severity="success">
            {t("auth:delete_account.request.success_message")}
          </Alert>
        )}
        <StyledForm onSubmit={onSubmit}>
          <Typography variant="subtitle1">
            <Trans
              t={t}
              i18nKey="auth:delete_account.request.confirm_username_explanation"
              values={{ username }}
            >
              {`Your username is `}
              <strong>{username}</strong>
              {`, please type it in below to confirm account deletion.`}
            </Trans>
          </Typography>
          <TextField
            id="confirmUsername"
            {...register("confirmUsername", { required: true })}
            label={t("auth:delete_account.request.confirm_username_label")}
            fullWidth={!isMobile}
          />
          <Typography variant="subtitle1">
            {t("auth:delete_account.request.reason_explanation")}
          </Typography>
          <TextField
            id="reason"
            {...register("reason")}
            label={t("auth:delete_account.request.reason_label")}
            minRows={4}
            maxRows={6}
            multiline
            fullWidth
          />
          <Button
            fullWidth={!isMobile}
            loading={isDeleteAccountLoading}
            type="submit"
          >
            {t("global:submit")}
          </Button>
        </StyledForm>
      </>
    </div>
  );
}
