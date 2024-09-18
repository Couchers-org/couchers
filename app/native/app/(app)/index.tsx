import { useAuthContext } from "@/features/auth/AuthProvider";
import { Text, View } from "react-native";

export default function Index() {
  const { authActions } = useAuthContext();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text onPress={authActions.logout}>Sign Out</Text>
    </View>
  );
}
