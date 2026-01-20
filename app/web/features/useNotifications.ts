import { useQuery } from "@tanstack/react-query";
import { pingInterval } from "appConstants";
import { useAuthContext } from "features/auth/AuthProvider";
import { pingQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

import { PingRes } from "../proto/api_pb";

export default function useNotifications() {
  const { authenticated, jailed } = useAuthContext().authState;

  const { data, isPending, isError, error } = useQuery<
    PingRes.AsObject,
    RpcError
  >({
    queryKey: [pingQueryKey],
    queryFn: () => service.api.ping(),
    enabled: authenticated && !jailed,
    refetchInterval: pingInterval,
  });
  return { data, error, isError, isPending };
}
