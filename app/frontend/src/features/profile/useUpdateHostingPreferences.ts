import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { service, HostingPreferenceData } from "../../service";
import { SetMutationError } from "../../utils/types";
import { useAuthContext } from "../auth/AuthProvider";

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
      onMutate: async ({ setMutationError }) => {
        setMutationError(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["user", userId]);
      },
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
    }
  );

  return { updateHostingPreferences, status, reset };
}
