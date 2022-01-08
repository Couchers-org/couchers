import { pingInterval } from "appConstants";
import { useAuthContext } from "features/auth/AuthProvider";
import { Error } from "grpc-web";
import { PingRes } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

export default function useNotifications() {
  const { authenticated, jailed } = useAuthContext().authState;

  const { data, isLoading, isError, error } = useQuery<PingRes.AsObject, Error>(
    "ping",
    service.api.ping,
    {
      enabled: authenticated && !jailed,
      refetchInterval: pingInterval,
    }
  );
  return { data, error, isError, isLoading };
}
