import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { baseRoute } from "@/routes";

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
      router.push(baseRoute);
    },
  });

  const mutate = logout.mutate;
  useEffect(() => {
    mutate();
  }, [mutate]);

  return (
    <>
      {logout.error ? (
        <Alert severity="error">{logout.error.message}</Alert>
      ) : (
        <CenteredSpinner />
      )}
    </>
  );
}
