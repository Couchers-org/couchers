import { useAuthContext } from "features/auth/AuthProvider";
import { accountInfoQueryKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "react-query";
import { routeToProfile } from "routes";
import { service, UpdateUserProfileData } from "service/index";
import { SetMutationError } from "utils/types";

interface UpdateUserProfileVariables {
  profileData: UpdateUserProfileData;
  setMutationError: SetMutationError;
}

export default function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();
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
        router.push(routeToProfile("about"));
      },
    }
  );

  return { reset, updateUserProfile, isLoading, isError, status };
}
