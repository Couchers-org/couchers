import { Notifications } from "@couchers/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import { NOTIFICATION_SETTINGS_QUERY_KEY } from "@/features/queryKeys";
import serviceClients from "@/serviceClients";
import { SetMutationError } from "@/utils/setMutationError";

const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const {
    mutate: updateNotificationSettings,
    reset,
    isPending,
    isError,
    isSuccess,
    status,
  } = useMutation<
    Notifications.GetNotificationSettingsRes,
    RpcError,
    {
      preferenceData: Omit<
        Notifications.SingleNotificationPreference,
        "$typeName"
      >;
      setMutationError: SetMutationError;
    }
  >({
    mutationFn: ({ preferenceData }) =>
      serviceClients.notifications.setNotificationSettings({
        preferences: [preferenceData],
      }),
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_SETTINGS_QUERY_KEY],
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
};

export default useUpdateNotificationSettings;
