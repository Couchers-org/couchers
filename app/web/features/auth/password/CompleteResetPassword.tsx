import { CircularProgress, Container } from "@material-ui/core";
import Alert from "components/Alert";
import { useAppRouteStyles } from "components/AppRoute";
import HtmlMeta from "components/HtmlMeta";
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

export default function CompleteResetPassword() {
  const { t } = useTranslation(AUTH);
  const classes = useAppRouteStyles();

  const router = useRouter();
  const resetToken = stringOrFirstString(router.query.token);

  const {
    error,
    isLoading,
    isSuccess,
    mutate: completePasswordReset,
  } = useMutation<Empty, RpcError, string>((resetToken) =>
    service.account.completePasswordReset(resetToken)
  );

  useEffect(() => {
    if (resetToken) {
      completePasswordReset(resetToken);
    }
  }, [completePasswordReset, resetToken]);

  return (
    <Container className={classes.standardContainer}>
      <HtmlMeta title={t("reset_password")} />
      {isLoading ? (
        <CircularProgress />
      ) : isSuccess ? (
        <>
          <Alert severity="success">{t("reset_password_success")}</Alert>
          <StyledLink href={loginRoute}>{t("login_prompt")}</StyledLink>
        </>
      ) : error ? (
        <Alert severity="error">
          {t("reset_password_error", { message: error.message })}
        </Alert>
      ) : (
        ""
      )}
    </Container>
  );
}
