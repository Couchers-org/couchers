import { ThemedText } from "@/components/ThemedText";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Text, View } from "react-native";

export default function Explore() {
  const { authActions } = useAuthContext();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedText type="title">Explore Page</ThemedText>
      <Text onPress={authActions.logout}>Sign Out</Text>
    </View>
  );
}
