import { Error } from "grpc-web";
import { useQuery } from "react-query";
import { pingInterval } from "../constants";
import { PingRes } from "../pb/api_pb";
import { service } from "../service";

export default function useNotifications() {
  const { data, isLoading, isError, error } = useQuery<PingRes.AsObject, Error>(
    "ping",
    service.api.ping,
    {
      refetchInterval: pingInterval,
    }
  );
  return { data, isLoading, isError, error };
}
