import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { HostingPreferenceData, service } from "service/index";
import { SetMutationError } from "utils/types";

interface UpdateHostingPreferencesVariables {
  preferenceData: HostingPreferenceData;
  setMutationError: SetMutationError;
}

export default function useUpdateHostingPreferences() {
  const queryClient = useQueryClient();
  const userId = useAuthContext().authState.userId;
  const { mutate: updateHostingPreferences, status, reset } = useMutation<
    Empty,
    Error,
    UpdateHostingPreferencesVariables
  >(
    ({ preferenceData }) =>
      service.user.updateHostingPreference(preferenceData),
    {
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
      onMutate: async ({ setMutationError }) => {
        setMutationError(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["user", userId]);
      },
    }
  );

  return { reset, status, updateHostingPreferences };
}
