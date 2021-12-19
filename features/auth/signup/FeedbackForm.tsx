import * as Sentry from "@sentry/react";
import ContributorForm from "components/ContributorForm";
import { useAuthContext } from "features/auth/AuthProvider";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { useTranslation } from "next-i18next";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";

export default function FeedbackForm() {
  const { t } = useTranslation("global");
  const { authActions, authState } = useAuthContext();

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    authActions.clearError();
    try {
      const res = await service.auth.signupFlowFeedback(
        authState.flowState!.flowToken,
        form
      );
      authActions.updateSignupState(res);
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          component: "auth/signup/feedbackForm",
        },
      });
      authActions.authError(
        isGrpcError(err) ? err.message : t("fatal_error_message")
      );
    }
    window.scroll({ top: 0, behavior: "smooth" });
  };

  return <ContributorForm processForm={handleSubmit} autofocus />;
}
