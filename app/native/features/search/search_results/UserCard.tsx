import { router } from "expo-router";
import Button from "@/components/Button";
import UserSummary from "@/components/UserSummary";
import { routeToUser } from "@/routes";
import { useUser } from "@/features/userQueries/useUser";
import { routeToCreateMessage } from "@/routes";
import { View, StyleSheet, Text } from "react-native";
import { TouchableOpacity } from "react-native";
import { AgeGenderLanguagesLabels } from "@/features/profile/view/userLabels";
import { RemainingAboutLabels } from "@/features/profile/view/userLabels";
import { ResponseRateLabel } from "@/features/profile/view/userLabels";

const styles = StyleSheet.create({
  userCard: {
    position: "absolute",
    bottom: 20,
    left: "7.5%",
    width: "85%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 1,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

interface UserCardProps {
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
}

export default function UserCard({
  selectedUserId,
  setSelectedUserId,
}: UserCardProps) {
  const user = useUser(selectedUserId ? parseInt(selectedUserId) : undefined);

  if (user.data == undefined && !user.isLoading) {
    return null;
  }
  return (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          console.log('Close button pressed');
          setSelectedUserId(null);
        }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
      {user.isLoading && <Text>Loading...</Text>}
      {user.data && (
        <>
          <UserSummary user={user.data} smallAvatar={true} />
          {user.data && <AgeGenderLanguagesLabels user={user.data} />}
          {user.data && <ResponseRateLabel user={user.data} />}
          <Button style={{ marginTop: 16 }} title="Go to Profile" onPress={() => {
            router.push(routeToUser(user.data!.username, 'about') as any);
          }} />
        </>
      )}
    </View>
  );
}
