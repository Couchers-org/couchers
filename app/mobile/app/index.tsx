import { Redirect } from "expo-router";
import { useAuthContext } from "@/features/auth/AuthProvider";

export default function Index() {
  const { authState } = useAuthContext();

  // The RootLayoutNav handles which navigator to show
  // This just redirects to the appropriate initial route
  if (authState.authenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/login" />;
}
