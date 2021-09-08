import { PingRes } from "couchers-core/src/proto/api_pb";
import { service } from "couchers-core/dist/service";
import { useAuthContext } from "features/auth/AuthProvider";
import { Error } from "grpc-web";
import { useQuery } from "react-query";

import { pingInterval } from "../constants";

export default function useNotifications() {
  const { jailed } = useAuthContext().authState;

  const { data, isLoading, isError, error } = useQuery<PingRes.AsObject, Error>(
    "ping",
    service.api.ping,
    {
      enabled: !jailed,
      refetchInterval: pingInterval,
    }
  );
  return { data, error, isError, isLoading };
}
