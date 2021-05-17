import { useAuthContext } from "features/auth/AuthProvider";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { routeToUser } from "routes";
import { HostingPreferenceData, service } from "service";
import { SetMutationError } from "utils/types";

interface UpdateHostingPreferencesVariables {
  preferenceData: HostingPreferenceData;
  setMutationError: SetMutationError;
}

export default function useUpdateHostingPreferences() {
  const queryClient = useQueryClient();
  const history = useHistory();
  const userId = useAuthContext().authState.userId;
  const { data: user } = useCurrentUser();
  const {
    mutate: updateHostingPreferences,
    reset,
    isLoading,
    isError,
    status,
  } = useMutation<Empty, Error, UpdateHostingPreferencesVariables>(
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
        if (user) {
          history.push(routeToUser(user.username, "home"));
        }
      },
    }
  );

  return {
    reset,
    updateHostingPreferences,
    isLoading,
    isError,
    status,
  };
}
