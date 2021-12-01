import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { accountInfoQueryKey, userKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { routeToProfile } from "routes";
import { service, UpdateUserProfileData } from "service/index";
import { SetMutationError } from "utils/types";

interface UpdateUserProfileVariables {
  profileData: UpdateUserProfileData;
  setMutationError: SetMutationError;
}

export default function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const history = useHistory();
  const userId = useAuthContext().authState.userId;
  const {
    mutate: updateUserProfile,
    reset,
    isLoading,
    isError,
    status,
  } = useMutation<Empty, Error, UpdateUserProfileVariables>(
    ({ profileData }) => service.user.updateProfile(profileData),
    {
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
      onMutate: ({ setMutationError }) => {
        setMutationError(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(userKey(userId ?? 0));
        queryClient.invalidateQueries(accountInfoQueryKey);
        history.push(routeToProfile("about"));
      },
    }
  );

  return { reset, updateUserProfile, isLoading, isError, status };
}
