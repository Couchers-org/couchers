import { useRouter } from "next/router";

import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUser } from "@/features/userQueries/useUsers";
import log from "@/log";
import { LOGIN_ROUTE } from "@/routes";

const useCurrentUser = () => {
  const authState = useAuthContext().authState;
  const userQuery = useUser(authState.userId ?? undefined);
  const router = useRouter();
  if (!authState.userId) {
    log.error("No user id available to get current user.");
    if (typeof window !== "undefined") void router.push(LOGIN_ROUTE);
  }
  return userQuery;
};

export default useCurrentUser;
