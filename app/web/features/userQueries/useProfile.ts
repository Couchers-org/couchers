import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { profileKey } from "features/queryKeys";
import { userStaleTime } from "features/userQueries/constants";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Profile } from "proto/api_pb";
import { useEffect } from "react";
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
  const profileQuery = useProfile(authState.userId ?? undefined);
  const router = useRouter();

  useEffect(() => {
    if (!authState.userId) {
      console.error("No user id available to get current profile.");
      if (typeof window !== "undefined") router.push(loginRoute);
    }
  }, [authState.userId, router]);

  return profileQuery;
}
