import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import {
  GetNotificationSettingsRes,
} from "proto/notifications_pb";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { service } from "service";
import { NotificationPreferenceData } from "service/notifications";

const useNotificationSettings = () => {
  const notificationSettingsQuery = useQuery<
    GetNotificationSettingsRes.AsObject,
    RpcError
  >(
    notificationSettingsQueryKey,
    service.notifications.getNotificationSettings
  );

  return notificationSettingsQuery;
};

const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const {
    mutate: updateNotificationSettings,
    reset,
    isLoading,
    isError,
    status,
  } = useMutation<
    GetNotificationSettingsRes.AsObject,
    RpcError,
    NotificationPreferenceData
  >(
    (preferenceData: NotificationPreferenceData) => 
      service.notifications.setNotificationSettingsPreference(preferenceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(notificationSettingsQueryKey);
      },
    }
  );

  return { updateNotificationSettings, reset, isLoading, isError, status };
};

export { useNotificationSettings, useUpdateNotificationSettings };
