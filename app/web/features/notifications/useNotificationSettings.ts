import { useQuery } from "@tanstack/react-query";
import { GetNotificationSettingsRes } from "couchers/proto/notifications_pb";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";

export default function useNotificationSettings() {
  const notificationSettingsQuery = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >({
    queryKey: [notificationSettingsQueryKey],
    queryFn: service.notifications.getNotificationSettings,
  });

  return notificationSettingsQuery;
}
