import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { profileRoute } from "routes";
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
  const { mutate: updateUserProfile, status, reset } = useMutation<
    Empty,
    Error,
    UpdateUserProfileVariables
  >(({ profileData }) => service.user.updateProfile(profileData), {
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: async ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user", userId]);
      history.push(profileRoute);
    },
  });

  return { reset, status, updateUserProfile };
}
