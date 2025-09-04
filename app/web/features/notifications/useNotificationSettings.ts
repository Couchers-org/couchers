import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { notificationSettingsQueryKey } from "@/features/queryKeys";
import { GetNotificationSettingsRes } from "@/proto/notifications_pb";
import { service } from "@/service";

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
