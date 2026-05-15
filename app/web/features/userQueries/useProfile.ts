import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { profileKey } from "features/queryKeys";
import { userStaleTime } from "features/userQueries/constants";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Profile } from "proto/api_pb";
import { loginRoute } from "routes";
import { service } from "service";

export function useProfile(userId: number | undefined) {
  return useQuery<Profile.AsObject, RpcError>({
    queryFn: () => service.user.getProfile(userId!.toString()),
    queryKey: profileKey(userId),
    staleTime: userStaleTime,
    enabled: !!userId,
  });
}

export function useCurrentProfile() {
  const authState = useAuthContext().authState;
  const router = useRouter();
  if (!authState.userId && typeof window !== "undefined") {
    router.push(loginRoute);
  }
  return useProfile(authState.userId ?? undefined);
}
