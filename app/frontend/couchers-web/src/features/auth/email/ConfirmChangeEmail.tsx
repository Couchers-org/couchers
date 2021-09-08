import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import {
  ConfirmChangeEmailRes,
  EmailConfirmationState,
} from "couchers-core/src/proto/auth_pb";
import { service } from "couchers-core/dist/service";
import {
  CHANGE_EMAIL_ERROR,
  CHANGE_EMAIL_NEED_NEW,
  CHANGE_EMAIL_NEED_OLD,
  CHANGE_EMAIL_PROGRESS,
  CHANGE_EMAIL_SUCCESS,
  CLICK_LOGIN,
} from "features/auth/constants";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";
import { loginRoute } from "routes";

export default function ConfirmChangeEmail() {
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
        return CHANGE_EMAIL_SUCCESS;
      case EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_NEW_EMAIL:
        return CHANGE_EMAIL_NEED_NEW;
      case EmailConfirmationState.EMAIL_CONFIRMATION_STATE_REQUIRES_CONFIRMATION_FROM_OLD_EMAIL:
        return CHANGE_EMAIL_NEED_OLD;
      default:
        throw Error("Invalid email confirmation state");
    }
  }

  return isLoading ? (
    <Typography variant="body1">{CHANGE_EMAIL_PROGRESS}</Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">{successMsg(data!.state)}</Alert>
      {data?.state ===
        EmailConfirmationState.EMAIL_CONFIRMATION_STATE_SUCCESS && (
        <Typography variant="body1" component={Link} to={loginRoute}>
          {CLICK_LOGIN}
        </Typography>
      )}
    </>
  ) : (
    error && (
      <Alert severity="error">{`${CHANGE_EMAIL_ERROR}${error.message}`}</Alert>
    )
  );
}
