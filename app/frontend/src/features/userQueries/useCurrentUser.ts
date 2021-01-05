import { useAuthContext } from "../auth/AuthProvider";
import { useUser } from "./useUsers";

export default function useCurrentUser() {
  const authState = useAuthContext().authState;
  ///TODO: is this assert okay?
  return useUser(authState.userId!);
}
