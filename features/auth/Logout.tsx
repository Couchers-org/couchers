import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { baseRoute } from "routes";

import { useAuthContext } from "./AuthProvider";

export default function Logout() {
  const { authActions } = useAuthContext();
  const queryClient = useQueryClient();

  const router = useRouter();
  const logout = useMutation<void, RpcError>(
    async () => {
      authActions.logout();
      queryClient.clear();
    },
    {
      onSuccess: () => {
        router.push(baseRoute);
      },
    }
  );

  const mutate = logout.mutate;
  useEffect(() => {
    mutate();
  }, [mutate]);

  return (
    <>
      {logout.error ? (
        <Alert severity="error">{logout.error.message}</Alert>
      ) : (
        <CircularProgress />
      )}
    </>
  );
}
