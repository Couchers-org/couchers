import { PingRes } from "@couchers/services/api";
import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { PING_INTERVAL } from "@/appConstants";
import { useAuthContext } from "@/features/auth/AuthProvider";
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
    refetchInterval: PING_INTERVAL,
  });
  return { data, error, isError, isPending };
};

export default useNotifications;
