import { ActivityIndicator } from "react-native";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { ThemedText } from "@/components/ThemedText";
import UserCard from "./UserCard";
import { UserTab } from "@/routes";
import Alert from "@/components/Alert";
import { ProfileUserProvider } from "../hooks/useProfileUser";
import Overview from "./Overview";

export default function ProfilePage({ tab = "about" }: { tab?: UserTab }) {
  const currentUser = useCurrentUser();
  if (currentUser === undefined) {
    return <ThemedText>Current user not found</ThemedText>;
  }
  const { data: user, error, isLoading } = currentUser;

  return (
    <>
      {error && <Alert>{error}</Alert>}
      {isLoading ? (
        <ActivityIndicator />
      ) : user ? (
        <>
          <ProfileUserProvider user={user}>
            <Overview tab={tab} setIsRequesting={() => {}} />
            <UserCard tab={tab} />
          </ProfileUserProvider>
        </>
      ) : null}
    </>
  );
}
