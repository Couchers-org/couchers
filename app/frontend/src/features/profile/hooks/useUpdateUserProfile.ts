import { useAuthContext } from "features/auth/AuthProvider";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { routeToUser } from "routes";
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
  const { data: user } = useCurrentUser();
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
        queryClient.invalidateQueries(["user", userId]);
        if (user) {
          history.push(routeToUser(user.username, "about"));
        } else {
          throw new Error("User is undefined after saving user profile.");
        }
      },
    }
  );

  return { reset, updateUserProfile, isLoading, isError, status };
}
