import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { pingInterval } from "@/appConstants";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { PingRes } from "@/proto/api_pb";
import { service } from "@/service";

const useNotifications = () => {
  const { isAuthenticated, isJailed } = useAuthContext().authState;

  const { data, isPending, isError, error } = useQuery<
    PingRes.AsObject,
    RpcError
  >({
    queryKey: ["ping"],
    queryFn: () => service.api.ping(),
    enabled: isAuthenticated && !isJailed,
    refetchInterval: pingInterval,
  });
  return { data, error, isError, isPending };
};

export default useNotifications;
