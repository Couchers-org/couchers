import { RpcError } from "grpc-web";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { notificationSettingsQueryKey } from "features/queryKeys";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { service } from "service";
import { NotificationPreferenceData } from "service/notifications";
import { SetMutationError } from "utils/types";

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
    {
      preferenceData: NotificationPreferenceData;
      setMutationError: SetMutationError;
    }
  >(
    ({ preferenceData }: { preferenceData: NotificationPreferenceData }) =>
      service.notifications.setNotificationSettingsPreference(preferenceData),
    {
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
      onMutate: ({ setMutationError }) => {
        setMutationError(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(notificationSettingsQueryKey);
      },
    }
  );

  return { updateNotificationSettings, reset, isLoading, isError, status };
};

export { useNotificationSettings, useUpdateNotificationSettings };
