import { useMutation } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import TagManager from "react-gtm-module";

import Alert from "@/components/Alert";
import { useAuthContext } from "@/features/auth/AuthProvider";
import CommunityGuidelines from "@/features/auth/CommunityGuidelines";
import { service } from "@/service";

const CommunityGuidelinesForm = () => {
  const { authActions, authState } = useAuthContext();

  const mutation = useMutation<unknown, RpcError, boolean>({
    mutationFn: async (accept) => {
      if (!authState.flowState) {
        return;
      }

      const state = await service.auth.signupFlowCommunityGuidelines(
        authState.flowState.flowToken,
        accept,
      );
      TagManager.dataLayer({
        dataLayer: {
          event: "sign_up",
          signupMethod: "email",
          userId: state.authRes?.userId || -1,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "gtm.elementUrl": `${window.location.hostname}${window.location.pathname}`,
        },
      });
      authActions.updateSignupState(state);
    },
    onMutate: () => {
      authActions.clearError();
    },
    onSettled: () => {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });

  return (
    <>
      {mutation.error && (
        <Alert severity="error">{mutation.error.message || ""}</Alert>
      )}
      <CommunityGuidelines
        onSubmit={(accept) => mutation.mutateAsync(accept)}
      />
    </>
  );
};

export default CommunityGuidelinesForm;
