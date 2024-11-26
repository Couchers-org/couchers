import { Typography } from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { loginRoute } from "routes";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

export default function ConfirmChangeEmail() {
  const { t } = useTranslation(AUTH);

  const router = useRouter();
  const changeToken = stringOrFirstString(router.query.token);

  const {
    error,
    isLoading,
    isSuccess,
    mutate: confirmChangeEmail,
  } = useMutation<Empty, RpcError, string>((resetToken) =>
    service.account.confirmChangeEmail(resetToken)
  );

  useEffect(() => {
    if (changeToken) {
      confirmChangeEmail(changeToken);
    }
  }, [confirmChangeEmail, changeToken]);

  return isLoading ? (
    <Typography variant="body1">
      {t("change_email_confirmation.change_in_progress")}
    </Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">
        {t("change_email_confirmation.success_message")}
      </Alert>
      <StyledLink href={loginRoute}>{t("login_prompt")}</StyledLink>
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
