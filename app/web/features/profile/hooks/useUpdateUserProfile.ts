import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { useAuthContext } from "@/features/auth/AuthProvider";
import { ACCOUNT_INFO_QUERY_KEY, userKey } from "@/features/queryKeys";
import { UpdateUserProfileData, service } from "@/service/index";
import { SetMutationError } from "@/utils/setMutationError";

interface UpdateUserProfileVariables {
  profileData: UpdateUserProfileData;
  setMutationError: SetMutationError;
  onSuccess?: () => void;
}

const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const userId = useAuthContext().authState.userId;
  const {
    mutate: updateUserProfile,
    reset,
    isPending,
    isError,
    status,
  } = useMutation<Empty, Error, UpdateUserProfileVariables>({
    mutationFn: ({ profileData }) => service.user.updateProfile(profileData),
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: async (_, { onSuccess }) => {
      await queryClient.invalidateQueries({ queryKey: userKey(userId ?? 0) });
      await queryClient.invalidateQueries({
        queryKey: [ACCOUNT_INFO_QUERY_KEY],
      });
      onSuccess?.();
    },
  });

  return { reset, updateUserProfile, isPending, isError, status };
};

export default useUpdateUserProfile;
