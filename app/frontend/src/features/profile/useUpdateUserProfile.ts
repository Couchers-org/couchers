import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";

import { service, UpdateUserProfileData } from "../../service";
import { SetMutationError } from "../../utils/types";
import { useAuthContext } from "../auth/AuthProvider";

interface UpdateUserProfileVariables {
  profileData: UpdateUserProfileData;
  setMutationError: SetMutationError;
}

export default function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthContext().authState.userId;
  const { mutate: updateUserProfile, status, reset } = useMutation<
    Empty,
    Error,
    UpdateUserProfileVariables
  >(({ profileData }) => service.user.updateProfile(profileData), {
    onMutate: async ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user", userId]);
    },
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
  });

  return { updateUserProfile, status, reset };
}
