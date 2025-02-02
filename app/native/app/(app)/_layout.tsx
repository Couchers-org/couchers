import { Slot, useRouter } from "expo-router";
import { PaperProvider, MD3LightTheme as DefaultTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { groupChatsRoute, profileBaseRoute } from "@/routes";
import { useRouteInfo } from "expo-router/build/hooks";
import useCurrentUser from "@/features/userQueries/useCurrentUser";

const TabBar = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routeInfo = useRouteInfo();

  const tabs = [
    { name: 'Explore', icon: 'search', path: '/explore', segment: 'explore' },
    { name: 'Messages', icon: 'chatbubble-ellipses', path: groupChatsRoute, segment: 'messages' },
    { name: 'Community', icon: 'people', path: '/community', segment: 'community' },
    { name: 'Help', icon: 'help-circle', path: '/help', segment: 'help' },
    { name: 'Me', icon: 'person', path: profileBaseRoute, segment: 'profile' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = routeInfo.segments.includes(tab.segment);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => router.push(tab.path as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? "#007AFF" : "#8E8E93"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'black',
    onSurfaceVariant: 'black'
  },
};

export default function AppLayout() {
  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <Slot />
        <TabBar />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
