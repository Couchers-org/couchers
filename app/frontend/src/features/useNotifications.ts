import { useAuthContext } from "features/auth/AuthProvider";
import { Error } from "grpc-web";
import { PingRes } from "proto/api_pb";
import { useQuery } from "react-query";
import { service } from "service";

import { pingInterval } from "../constants";

export default function useNotifications() {
  const { jailed, authenticated } = useAuthContext().authState;

  const { data, isLoading, isError, error } = useQuery<PingRes.AsObject, Error>(
    "ping",
    service.api.ping,
    {
      enabled: !jailed && authenticated,
      refetchInterval: pingInterval,
    }
  );
  return { data, error, isError, isLoading };
}
