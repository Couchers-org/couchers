import { useQuery } from "@tanstack/react-query";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { service } from "service";

export default function useNotificationSettings() {
  const notificationSettingsQuery = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >(
    notificationSettingsQueryKey,
    service.notifications.getNotificationSettings,
  );

  return notificationSettingsQuery;
}
