import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { accountInfoQueryKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { service, UpdateUserProfileData } from "service/index";
import { SetMutationError } from "utils/setMutationError";

interface UpdateUserProfileVariables {
  profileData: UpdateUserProfileData;
  setMutationError: SetMutationError;
  onSuccess?: () => void;
}

export default function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthContext().authState.userId;
  const {
    mutate: updateUserProfile,
    reset,
    isPending,
    isError,
    status,
    error,
  } = useMutation<Empty, Error, UpdateUserProfileVariables>({
    mutationFn: ({ profileData }) => service.user.updateProfile(profileData),
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: ({ setMutationError }) => {
      setMutationError(null);
    },
    onSuccess: (_, { onSuccess }) => {
      queryClient.invalidateQueries({ queryKey: userKey(userId ?? 0) });
      queryClient.invalidateQueries({ queryKey: [accountInfoQueryKey] });
      onSuccess?.();
    },
  });

  return { reset, updateUserProfile, isPending, isError, status, error };
}
