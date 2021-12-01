import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { Error as GrpcError } from "grpc-web";
import { ConfirmChangeEmailRes, EmailConfirmationState } from "proto/auth_pb";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useParams } from "react-router-dom";
import { loginRoute } from "routes";
import { service } from "service";

export default function ConfirmChangeEmail() {
  const { t } = useTranslation("auth");
  const { resetToken } = useParams<{ resetToken?: string }>();

  const {
    data,
    error,
    isLoading,
    isSuccess,
    mutate: confirmChangeEmail,
  } = useMutation<ConfirmChangeEmailRes.AsObject, GrpcError, string>(
    (resetToken) => service.account.confirmChangeEmail(resetToken)
  );

  useEffect(() => {
    if (resetToken) {
      confirmChangeEmail(resetToken);
    }
  }, [confirmChangeEmail, resetToken]);

  function successMsg(state: EmailConfirmationState) {
    switch (state) {
      case EmailConfirmationState.EMAIL_CONFIRMATION_STATE_SUCCESS:
        return t("change_email_confirmation.success_message");
      case EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL:
        return t(
          "change_email_confirmation.requires_confirmation_from_new_email"
        );
      case EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL:
        return t(
          "change_email_confirmation.requires_confirmation_from_old_email"
        );
      default:
        throw Error(t("change_email_confirmation.invalid_confirmation_state"));
    }
  }

  return isLoading ? (
    <Typography variant="body1">
      {t("change_email_confirmation.change_in_progress")}
    </Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">{successMsg(data!.state)}</Alert>
      {data?.state ===
        EmailConfirmationState.EMAIL_CONFIRMATION_STATE_SUCCESS && (
        <StyledLink to={loginRoute}>{t("login_prompt")}</StyledLink>
      )}
    </>
  ) : (
    error && (
      <Alert severity="error">
        {t("change_email_confirmation.error_message", {
          message: error.message,
        })}
      </Alert>
    )
  );
}
