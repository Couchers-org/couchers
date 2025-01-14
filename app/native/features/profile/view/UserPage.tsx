import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import Alert from "@/components/Alert";
import { UserTab } from '@/routes';

import UserCard from "./UserCard";
import useUserByUsername from '@/features/userQueries/useUserByUsername';
import Overview from './Overview';
import { ProfileUserProvider } from '../hooks/useProfileUser';


export default function UserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const { data: user, isLoading, error } = useUserByUsername(username, true);

  const [isRequesting, setIsRequesting] = useState(false);

  return (
    <ScrollView>
      {error && <Alert>{error}</Alert>}
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <View>
            <Overview setIsRequesting={setIsRequesting} tab={tab} />
            <UserCard
              tab={tab}
            />
          </View>
        </ProfileUserProvider>
      ) : null}
    </ScrollView>
  );
}
