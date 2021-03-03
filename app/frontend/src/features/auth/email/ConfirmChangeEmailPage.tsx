import { Typography } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import { loginRoute } from "../../../routes";
import { service } from "../../../service";

export default function ConfirmChangeEmailPage() {
  const { resetToken } = useParams<{ resetToken?: string }>();

  const {
    error,
    isLoading,
    isSuccess,
    mutate: completeChangeEmail,
  } = useMutation<Empty, GrpcError, string>((resetToken) =>
    service.account.completeChangeEmail(resetToken)
  );

  useEffect(() => {
    if (resetToken) {
      completeChangeEmail(resetToken);
    }
  }, [completeChangeEmail, resetToken]);

  return isLoading ? (
    <Typography variant="body1">Email change in progress...</Typography>
  ) : isSuccess ? (
    <>
      <Alert severity="success">
        Your email has been changed successfully!
      </Alert>
      <Typography variant="body1" component={Link} to={loginRoute}>
        Click here to login
      </Typography>
    </>
  ) : (
    error && (
      <Alert severity="error">{`Error changing email: ${error.message}`}</Alert>
    )
  );
}
