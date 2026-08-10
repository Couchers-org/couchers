import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { HostingPreferenceData, service } from "service";
import { SetMutationError } from "utils/setMutationError";

interface UpdateHostingPreferencesVariables {
  preferenceData: HostingPreferenceData;
  setMutationError: SetMutationError;
  onSuccess?: () => void;
}

export default function useUpdateHostingPreferences() {
  const queryClient = useQueryClient();
  const userId = useAuthContext().authState.userId;
  const {
    mutate: updateHostingPreferences,
    reset,
    isPending,
    isError,
    status,
  } = useMutation<Empty, Error, UpdateHostingPreferencesVariables>({
    mutationFn: ({ preferenceData }) => service.user.updateHostingPreference(preferenceData),
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: async ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: (_, { onSuccess }) => {
      queryClient.invalidateQueries({ queryKey: userKey(userId ?? 0) });
      onSuccess?.();
    },
  });

  return {
    reset,
    updateHostingPreferences,
    isPending,
    isError,
    status,
  };
}
