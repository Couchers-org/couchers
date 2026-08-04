import { Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { service } from "service";

export default function ResendVerificationEmailForm() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authActions, authState } = useAuthContext();
  const [resent, setResent] = useState<boolean>(false);
  const mutationResend = useMutation({
    mutationFn: async () => {
      const state = await service.auth.signupFlowResendVerificationEmail(authState.flowState!.flowToken);
      authActions.updateSignupState(state);
      setResent(true);
    },
  });
  const mutationRestart = useMutation({
    mutationFn: async () => {
      let state = await service.auth.signupFlowRestartSignup(authState.flowState!.flowToken);
      state.needBasic = true;
      authActions.updateSignupState(state);
    },
  });
  const handleResendVerification = async (e) =>{
    e.preventDefault();
    mutationResend.mutateAsync();
  };
  const handleRestartSignup = async (e) =>{
    e.preventDefault();
    mutationRestart.mutateAsync();
  };
  return (
    <>
      {mutationResend.error && <Alert severity="error">{mutationResend.error.message || ""}</Alert>}
      {mutationRestart.error && <Alert severity="error">{mutationRestart.error.message || ""}</Alert>}
      <Typography variant="body1" gutterBottom>
        {t("auth:sign_up_completed_prompt")}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {!resent ? (
          <Trans
            i18nKey="auth:sign_up_resend_verification_email_help"
            components={{
              2: (
                <StyledLink
                  href="#"
                  onClick={handleResendVerification}
                />
              ),
            }}
          />
        ) : (
          <>{t("auth:sign_up_resend_verification_done")}</>
        )}
      </Typography>
      <Typography variant="body1">
        <Trans
          i18nKey="auth:sign_up_restart_signup"
          components={{
            2: <StyledLink href="#" onClick={handleRestartSignup} />,
          }}
        />
      </Typography>
    </>
  );
}
