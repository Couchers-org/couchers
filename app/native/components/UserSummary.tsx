import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Title, Paragraph } from "react-native-paper";
import { User } from "proto/api_pb";
import { router } from "expo-router";
import { routeToUser } from "@/routes";

export const USER_TITLE_SKELETON_TEST_ID = "user-title-skeleton";

export interface UserSummaryProps {
  avatarIsLink?: boolean;
  children?: React.ReactNode;
  smallAvatar?: boolean;
  nameOnly?: boolean;
  user?: User.AsObject;
  titleIsLink?: boolean;
}

const CustomSkeleton = ({
  style,
  testID,
}: {
  style?: any;
  testID?: string;
}) => <View style={[style.skeleton, style]} testID={testID} />;

export default function UserSummary({
  avatarIsLink = true,
  children,
  smallAvatar = false,
  nameOnly = false,
  user,
  titleIsLink = false,
}: UserSummaryProps) {
  const title = (
    <Title style={styles.title} numberOfLines={nameOnly ? 1 : undefined}>
      {!user ? (
        <CustomSkeleton
          style={styles.titleSkeleton}
          testID={USER_TITLE_SKELETON_TEST_ID}
        />
      ) : nameOnly ? (
        user.name
      ) : (
        `${user.name}, ${user.age}`
      )}
    </Title>
  );

  return (
    <View style={styles.root}>
      <View style={styles.avatarContainer}>
        {!user ? (
          <CustomSkeleton
            style={[
              styles.avatarSkeleton,
              { width: smallAvatar ? 48 : 72, height: smallAvatar ? 48 : 72 },
            ]}
          />
        ) : (
          <TouchableOpacity
            disabled={!avatarIsLink}
            onPress={() => {
              router.push(routeToUser(user.username, 'about') as any);
            }}
          >
            {user.avatarUrl !== "" ? (
              <Avatar.Image
                size={smallAvatar ? 48 : 72}
              source={{ uri: user.avatarUrl }}
              />
            ) : (
              <Avatar.Icon size={smallAvatar ? 48 : 72} icon="account" />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.contentContainer}>
        {titleIsLink && user ? (
          <TouchableOpacity
            style={styles.link}
            onPress={() => {
              router.push(routeToUser(user.username, 'about') as any);
            }}
          >
            {title}
          </TouchableOpacity>
        ) : (
          title
        )}
        {!nameOnly && (
          <Paragraph numberOfLines={1}>
            {!user ? <CustomSkeleton style={styles.citySkeleton} /> : user.city}
          </Paragraph>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  avatarContainer: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    marginTop: 0,
  },
  titleSkeleton: {
    maxWidth: 300,
    height: 24,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkIcon: {
    marginLeft: 4,
    height: 20,
    width: 20,
  },
  skeleton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
  avatarSkeleton: {
    borderRadius: 36,
  },
  citySkeleton: {
    width: 100,
    height: 16,
  },
});
