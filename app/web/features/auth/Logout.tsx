import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { loginRoute } from "routes";

import { useAuthContext } from "./AuthProvider";

export default function Logout() {
  const { authActions } = useAuthContext();
  const queryClient = useQueryClient();

  const router = useRouter();
  const logout = useMutation({
    mutationFn: async () => {
      authActions.logout();
      queryClient.clear();
    },

    onSuccess: () => {
      router.push(loginRoute, undefined, { locale: router.locale });
    },
  });

  const mutate = logout.mutate;
  useEffect(() => {
    mutate();
  }, [mutate]);

  return <>{logout.error ? <Alert severity="error">{logout.error.message}</Alert> : <CenteredSpinner />}</>;
}
