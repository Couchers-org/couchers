import { Typography } from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { useMutation } from "react-query";
import { service } from "service";

export default function ResendVerificationEmailForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions, authState } = useAuthContext();

  const [resent, setResent] = useState<boolean>(false);

  const mutation = useMutation<void, RpcError>(
    async () => {
      const state = await service.auth.signupFlowResendVerificationEmail(
        authState.flowState!.flowToken
      );
      authActions.updateSignupState(state);
      setResent(true);
    },
    {
      onMutate() {
        authActions.clearError();
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <Typography variant="body1" gutterBottom>
        {t("auth:sign_up_completed_prompt")}
      </Typography>
      <Typography variant="body1">
        {!resent ? (
          <Trans i18nKey="auth:sign_up_resend_verification_email_help">
            Didn't receive the email? Click{" "}
            <StyledLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                mutation.mutateAsync();
              }}
            >
              here to resend the verification link
            </StyledLink>
            .
          </Trans>
        ) : (
          <>{t("auth:sign_up_resend_verification_done")}</>
        )}
      </Typography>
    </>
  );
}
