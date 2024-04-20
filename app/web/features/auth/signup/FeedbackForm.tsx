import { Typography } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import ContributorForm from "components/ContributorForm";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import TagManager from "react-gtm-module";
import { service } from "service";
import getRandomId from "utils/getRandomId";
import isGrpcError from "utils/isGrpcError";

export default function FeedbackForm() {
  const { t } = useTranslation(GLOBAL);
  const { authActions, authState } = useAuthContext();

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    authActions.clearError();
    try {
      const res = await service.auth.signupFlowFeedback(
        authState.flowState!.flowToken,
        form
      );
      TagManager.dataLayer({
        dataLayer: {
          event: "sign_up",
          signupMethod: "email",
          userId: getRandomId(),
          "gtm.elementUrl": `${window.location.hostname}${window.location.pathname}`,
        },
      });
      authActions.updateSignupState(res);
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          component: "auth/signup/feedbackForm",
        },
      });
      authActions.authError(
        isGrpcError(err) ? err.message : t("error.fatal_message")
      );
    }
    window.scroll({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Typography variant="h2">
        <Trans i18nKey="auth:feedback_form.skip_step_text">
          Not interested?{" "}
          <StyledLink
            variant="h2"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(new ContributorFormPb().toObject());
            }}
          >
            Skip this step
          </StyledLink>
        </Trans>
      </Typography>
      <ContributorForm processForm={handleSubmit} autofocus />
    </>
  );
}
