import ContributorForm from "components/ContributorForm";
import { useAuthContext } from "features/auth/AuthProvider";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { service } from "service";

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
      authActions.authError(err.message);
    }
  };

  return <ContributorForm processForm={handleSubmit} />;
}
