import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { BASE_ROUTE } from "@/routes";

import { useAuthContext } from "./AuthProvider";

const Logout = () => {
  const { authActions } = useAuthContext();
  const queryClient = useQueryClient();

  const router = useRouter();
  const logout = useMutation({
    mutationFn: async () => {
      await authActions.logout();
      queryClient.clear();
    },

    onSuccess: async () => {
      await router.push(BASE_ROUTE);
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
};

export default Logout;
