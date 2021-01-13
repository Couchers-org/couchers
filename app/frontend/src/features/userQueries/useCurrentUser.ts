import { useAuthContext } from "../auth/AuthProvider";
import { useUser } from "./useUsers";

export default function useCurrentUser() {
  const authState = useAuthContext().authState;
  if (!authState.userId)
    throw new Error("No user id available to get current user.");
  return useUser(authState.userId);
}
