import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import {
  CHANGE_PASSWORD_ERROR,
  CHANGE_PASSWORD_PROGRESS,
  CHANGE_PASSWORD_SUCCESS,
  CLICK_LOGIN,
} from "features/auth/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";
import { loginRoute } from "routes";
import { service } from "service/index";

export default function CompleteResetPassword() {
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

  return isLoading ? (
    <Typography variant="body1">{CHANGE_PASSWORD_PROGRESS}</Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">{CHANGE_PASSWORD_SUCCESS}</Alert>
      <Typography variant="body1" component={Link} to={loginRoute}>
        {CLICK_LOGIN}
      </Typography>
    </>
  ) : (
    error && (
      <Alert severity="error">
        {`${CHANGE_PASSWORD_ERROR}${error.message}`}
      </Alert>
    )
  );
}
