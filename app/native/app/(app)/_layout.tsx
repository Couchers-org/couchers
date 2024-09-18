import { Text } from "react-native";
import { Redirect, Stack } from "expo-router";

import { useAuthContext } from "@/features/auth/AuthProvider";
import BasicScreen from "@/components/BasicScreen";

export default function AppLayout() {
  const { authState } = useAuthContext();

  if (authState.loading) {
    return (
      <BasicScreen>
        <Text>Loading...</Text>
      </BasicScreen>
    );
  }

  if (!authState.authenticated) {
    return <Redirect href={"/landing"} />;
  }

  return <Stack />;
}
