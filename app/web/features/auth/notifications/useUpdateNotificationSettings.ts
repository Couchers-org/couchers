import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetNotificationSettingsRes } from "proto/notifications_pb";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import { NotificationPreferenceData } from "service/notifications";
import { SetMutationError } from "utils/setMutationError";

export default function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const {
    mutate: updateNotificationSettings,
    reset,
    isLoading,
    isError,
    isSuccess,
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
    },
  );

  return {
    updateNotificationSettings,
    reset,
    isLoading,
    isError,
    isSuccess,
    status,
  };
}
