import { useAuthContext } from "features/auth/AuthProvider";
import { useUser } from "./useUser";
import { router } from "expo-router";
import { landingRoute } from "@/routes";

export default function useCurrentUser() {
  const authState = useAuthContext().authState;
  if (!authState.userId) {
    // console.error("No user id available to get current user.");
    router.push(landingRoute);
    return;
  }
  return useUser(authState.userId);
}
