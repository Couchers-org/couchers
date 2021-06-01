import ContributorForm from "components/ContributorForm";
import { useAuthContext } from "features/auth/AuthProvider";
import { ContributorForm as ContributorFormPb } from "pb/account_pb";
import { service } from "service";

import { SignupFormProps } from "./Signup";

export default function FeedbackForm({ token, updateState }: SignupFormProps) {
  const { authActions } = useAuthContext();

  const handleSubmit = async (form: ContributorFormPb) => {
    authActions.clearError();
    try {
      updateState(await service.auth.signupFlowFeedback(token, form));
      return true;
    } catch (err) {
      authActions.authError(err.message);
      return false;
    }
  };

  return <ContributorForm processForm={handleSubmit} />;
}
