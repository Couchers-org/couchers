import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { NOTIFICATION_SETTINGS_QUERY_KEY } from "@/features/queryKeys";
import { GetNotificationSettingsRes } from "@/proto/notifications_pb";
import { service } from "@/service";

export default function useNotificationSettings() {
  const notificationSettingsQuery = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >({
    queryKey: [NOTIFICATION_SETTINGS_QUERY_KEY],
    queryFn: service.notifications.getNotificationSettings,
  });

  return notificationSettingsQuery;
}
