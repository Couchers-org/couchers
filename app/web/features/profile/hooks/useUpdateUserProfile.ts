import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { accountInfoQueryKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useRouter } from "next/router";
import { routeToProfile } from "routes";
import { service, UpdateUserProfileData } from "service/index";
import { SetMutationError } from "utils/setMutationError";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKey(userId ?? 0) });
      queryClient.invalidateQueries({ queryKey: [accountInfoQueryKey] });
      router.push(routeToProfile("about"));
    },
  });

  return { reset, updateUserProfile, isPending, isError, status };
}
