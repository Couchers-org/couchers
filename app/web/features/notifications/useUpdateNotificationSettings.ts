import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GetNotificationSettingsRes } from "couchers/proto/notifications_pb";
import { notificationSettingsQueryKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { service } from "service";
import { NotificationPreferenceData } from "service/notifications";
import { SetMutationError } from "utils/setMutationError";

export default function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const {
    mutate: updateNotificationSettings,
    reset,
    isPending,
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
  >({
    mutationFn: ({ preferenceData }) =>
      service.notifications.setNotificationSettingsPreference(preferenceData),
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [notificationSettingsQueryKey],
      });
    },
  });

  return {
    updateNotificationSettings,
    reset,
    isPending,
    isError,
    isSuccess,
    status,
  };
}
