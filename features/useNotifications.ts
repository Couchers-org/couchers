import { pingInterval } from "appConstants";
import { useAuthContext } from "features/auth/AuthProvider";
import { RpcError } from "grpc-web";
import { PingRes } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useNotifications() {
  const { authenticated, jailed } = useAuthContext().authState;

  const { data, isLoading, isError, error } = useQuery<
    PingRes.AsObject,
    RpcError
  >("ping", service.api.ping, {
    enabled: authenticated && !jailed,
    refetchInterval: pingInterval,
  });
  return { data, error, isError, isLoading };
}
