import { useAuthContext } from "features/auth/AuthProvider";
import { useUser } from "./useUser";

export default function useCurrentUser() {
  const authState = useAuthContext().authState;
  if (!authState.userId) {
    console.error("No user id available to get current user.");
    return undefined;
  }
  return useUser(authState.userId);
}
