import { CircularProgress, Container } from "@material-ui/core";
import { useAppRouteStyles } from "AppRoute";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { useParams } from "react-router-dom";
import { loginRoute } from "routes";
import { service } from "service";

export default function CompleteResetPassword() {
  const { t } = useTranslation("auth");
  const classes = useAppRouteStyles();

  const { resetToken } = useParams<{ resetToken?: string }>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: completePasswordReset,
  } = useMutation<Empty, GrpcError, string>((resetToken) =>
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
          <StyledLink to={loginRoute}>{t("login_prompt")}</StyledLink>
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
