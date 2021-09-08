import * as Sentry from "@sentry/react";
import ContributorForm from "components/ContributorForm";
import { ERROR_INFO_FATAL } from "components/ErrorFallback/constants";
import { ContributorForm as ContributorFormPb } from "couchers-core/src/proto/auth_pb";
import { service } from "couchers-core/dist/service";
import { useAuthContext } from "features/auth/AuthProvider";
import isGrpcError from "couchers-core/dist/utils/isGrpcError";

export default function FeedbackForm() {
  const { authActions, authState } = useAuthContext();

  const handleSubmit = async (form: ContributorFormPb.AsObject) => {
    authActions.clearError();
    try {
      const res = await service.auth.signupFlowFeedback(
        authState.flowState?.flowToken!,
        form
      );
      authActions.updateSignupState(res);
    } catch (err) {
      Sentry.captureException(err, {
        tags: {
          component: "auth/signup/feedbackForm",
        },
      });
      authActions.authError(isGrpcError(err) ? err.message : ERROR_INFO_FATAL);
    }
    window.scroll({ top: 0, behavior: "smooth" });
  };

  return <ContributorForm processForm={handleSubmit} autofocus />;
}
