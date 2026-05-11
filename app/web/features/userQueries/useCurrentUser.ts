import { useAuthContext } from "features/auth/AuthProvider";
import { useUser } from "features/userQueries/useUsers";
import { useRouter } from "next/router";
import { loginRoute } from "routes";

export default function useCurrentUser() {
  const authState = useAuthContext().authState;
  const userQuery = useUser(authState.userId ?? undefined);
  const router = useRouter();
  // Only redirect if auth has been hydrated from storage and there's still no userId
  if (authState.isHydrated && !authState.userId) {
    console.error("No user id available to get current user.");
    if (typeof window !== "undefined") router.push(loginRoute);
  }
  return userQuery;
}
