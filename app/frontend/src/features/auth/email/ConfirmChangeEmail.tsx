import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import {
  CHANGE_EMAIL_ERROR,
  CHANGE_EMAIL_PROGRESS,
  CHANGE_EMAIL_SUCCESS,
  CLICK_LOGIN,
} from "features/auth/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";
import { loginRoute } from "routes";
import { service } from "service";

export default function ConfirmChangeEmail() {
  const { resetToken } = useParams<{ resetToken?: string }>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: confirmChangeEmail,
  } = useMutation<Empty, GrpcError, string>((resetToken) =>
    service.account.confirmChangeEmail(resetToken)
  );

  useEffect(() => {
    if (resetToken) {
      confirmChangeEmail(resetToken);
    }
  }, [confirmChangeEmail, resetToken]);

  return isLoading ? (
    <Typography variant="body1">{CHANGE_EMAIL_PROGRESS}</Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">{CHANGE_EMAIL_SUCCESS}</Alert>
      <Typography variant="body1" component={Link} to={loginRoute}>
        {CLICK_LOGIN}
      </Typography>
    </>
  ) : (
    error && (
      <Alert severity="error">{`${CHANGE_EMAIL_ERROR}${error.message}`}</Alert>
    )
  );
}
