import { CircularProgress, Container, Typography } from "@material-ui/core";
import { useAppRouteStyles } from "AppRoute";
import Alert from "components/Alert";
import {
  CLICK_LOGIN,
  RESET_PASSWORD_ERROR,
  RESET_PASSWORD_SUCCESS,
} from "features/auth/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";
import { loginRoute } from "routes";
import { service } from "service";

export default function CompleteResetPassword() {
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
      {isLoading ? (
        <CircularProgress />
      ) : isSuccess ? (
        <>
          <Alert severity="success">{RESET_PASSWORD_SUCCESS}</Alert>
          <Typography variant="body1" component={Link} to={loginRoute}>
            {CLICK_LOGIN}
          </Typography>
        </>
      ) : error ? (
        <Alert severity="error">
          {`${RESET_PASSWORD_ERROR}${error.message}`}
        </Alert>
      ) : (
        ""
      )}
    </Container>
  );
}
