import { Error } from "grpc-web";
import { PingRes } from "pb/api_pb";
import { useQuery } from "react-query";
import { service } from "service/index";

import { pingInterval } from "../constants";

export default function useNotifications() {
  const { data, isLoading, isError, error } = useQuery<PingRes.AsObject, Error>(
    "ping",
    service.api.ping,
    {
      refetchInterval: pingInterval,
    }
  );
  return { data, error, isError, isLoading };
}
