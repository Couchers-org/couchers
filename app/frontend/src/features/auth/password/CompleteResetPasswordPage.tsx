import { Typography } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import { service } from "../../../service";
import { useIsMounted, useSafeState } from "../../../utils/hooks";

export default function CompleteResetPasswordPage() {
  const isMounted = useIsMounted();
  const [error, setError] = useSafeState<string | null>(isMounted, null);
  const [loading, setLoading] = useSafeState(isMounted, false);
  const [success, setSuccess] = useSafeState(isMounted, false);
  const { resetToken } = useParams<{ resetToken?: string }>();

  useEffect(() => {
    setLoading(true);
    if (resetToken) {
      service.account
        .completePasswordReset(resetToken)
        .then(() => {
          setSuccess(true);
        })
        .catch((err: GrpcError) => setError(err.message))
        .then(() => setLoading(false));
    }
  }, [resetToken, setError, setLoading, setSuccess]);

  return loading ? (
    <Typography variant="body1">Password reset in progress...</Typography>
  ) : success ? (
    <Alert severity="success">Your password has been reset successfully!</Alert>
  ) : error ? (
    <Alert severity="error">Error resetting password: {error}</Alert>
  ) : null;
}
