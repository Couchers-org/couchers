import { GetNotificationSettingsRes } from "@couchers/services/notifications";
import { useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { NOTIFICATION_SETTINGS_QUERY_KEY } from "@/features/queryKeys";
import { service } from "@/service";

const useNotificationSettings = () => {
  const notificationSettingsQuery = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >({
    queryKey: [NOTIFICATION_SETTINGS_QUERY_KEY],
    queryFn: service.notifications.getNotificationSettings,
  });

  return notificationSettingsQuery;
};

export default useNotificationSettings;
