import { Typography } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import { loginRoute } from "../../../routes";
import { service } from "../../../service";

export default function CompleteResetPasswordPage() {
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
    <Typography variant="body1">Password reset in progress...</Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">
        Your password has been reset successfully!
      </Alert>
      <Typography variant="body1" component={Link} to={loginRoute}>
        Click here to login
      </Typography>
    </>
  ) : (
    error && (
      <Alert severity="error">
        {`Error resetting password: ${error.message}`}
      </Alert>
    )
  );
}
