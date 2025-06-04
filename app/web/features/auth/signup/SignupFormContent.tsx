import { Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { tosRoute } from "routes";

import { useAuthContext } from "../AuthProvider";
import AccountForm from "./AccountForm";
import BasicForm from "./BasicForm";
import CommunityGuidelinesForm from "./CommunityGuidelinesForm";
import ResendVerificationEmailForm from "./ResendVerificationEmailForm";

export default function SignupFormContent() {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const { authState } = useAuthContext();
  const state = authState.flowState;
  if (!state || state.needBasic) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("landing:signup_header")}
        </Typography>
        <Typography gutterBottom sx={{ marginBottom: 2 }}>
          {t("landing:signup_description", { user_count: "55k+" })}
        </Typography>
        <BasicForm submitText={t("global:create_account")} />
        <Typography variant="caption">
          <Trans i18nKey="auth:basic_sign_up_form.sign_up_agreement_explainer">
            By continuing, you agree to our{" "}
            <StyledLink
              href={tosRoute}
              target="_blank"
              variant="caption"
              sx={{ fontWeight: 700 }}
            >
              Terms of Service
            </StyledLink>
            , including our cookie, email, and data handling policies.
          </Trans>
        </Typography>
      </>
    );
  } else if (state.needAccount) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:account_form.header")}
        </Typography>
        <AccountForm />
      </>
    );
  } else if (state.needAcceptCommunityGuidelines) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:community_guidelines_form.header")}
        </Typography>
        <CommunityGuidelinesForm />
      </>
    );
  } else if (state.needVerifyEmail) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:sign_up_need_verification_title")}
        </Typography>
        <ResendVerificationEmailForm />
      </>
    );
  } else if (state.authRes) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          {t("auth:sign_up_completed_title")}
        </Typography>
        <Typography variant="body1">
          {t("auth:sign_up_confirmed_prompt")}
        </Typography>
      </>
    );
  } else {
    throw Error(t("auth:unhandled_sign_up_state"));
  }
}
