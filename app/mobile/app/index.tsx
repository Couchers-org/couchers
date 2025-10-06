import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/features/auth/AuthProvider";

export default function Index() {
  const { authState } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (authState.authenticated) {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/login");
    }
  }, [authState.authenticated, router]);

  return null;
}
