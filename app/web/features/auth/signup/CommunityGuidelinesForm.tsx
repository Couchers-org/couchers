import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import { useAuthContext } from "features/auth/AuthProvider";
import CommunityGuidelines from "features/auth/CommunityGuidelines";
import { RpcError } from "grpc-web";
import TagManager from "react-gtm-module";
import { service } from "service";

export default function CommunityGuidelinesForm() {
  const { authActions, authState } = useAuthContext();

  const mutation = useMutation<void, RpcError, boolean>({
    mutationFn: async (accept) => {
      const state = await service.auth.signupFlowCommunityGuidelines(authState.flowState!.flowToken, accept);
      TagManager.dataLayer({
        dataLayer: {
          event: "sign_up",
          signupMethod: "email",
          userId: state.authRes?.userId || -1,
          "gtm.elementUrl": `${window.location.hostname}${window.location.pathname}`,
        },
      });
      authActions.updateSignupState(state);
    },
    onMutate() {
      authActions.clearError();
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });

  return (
    <>
      {mutation.error && <Alert severity="error">{mutation.error.message || ""}</Alert>}
      <CommunityGuidelines onSubmit={(accept) => mutation.mutateAsync(accept)} />
    </>
  );
}
