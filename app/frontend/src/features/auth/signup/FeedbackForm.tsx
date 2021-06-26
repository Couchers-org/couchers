import ContributorForm from "components/ContributorForm";
import { useAuthContext } from "features/auth/AuthProvider";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
import { service } from "service";

export default function FeedbackForm() {
  const { authActions, authState } = useAuthContext();

  const handleSubmit = async (form: ContributorFormPb) => {
    authActions.clearError();
    try {
      authActions.updateSignupState(
        await service.auth.signupFlowFeedback(
          authState.flowState?.flowToken!,
          form
        )
      );
      return true;
    } catch (err) {
      authActions.authError(err.message);
      return false;
    }
  };

  return <ContributorForm processForm={handleSubmit} />;
}
