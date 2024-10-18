import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tooltip, Chip } from 'react-native-paper';
import { User } from "@/proto/api_pb";
import { useBadges } from "../hooks/useBadges";

interface Props {
  user: User.AsObject;
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    margin: 4,
  },
});

export const Badges = ({ user }: Props) => {
  const { badges } = useBadges();

  if (badges === undefined || user.badgesList === undefined) {
    return null;
  }

  return (
    <View style={styles.badgeContainer}>
      {(user.badgesList || []).map((badgeId) => {
        const badge = (badges || {})[badgeId];
        return (
          <Tooltip key={badge.id} title={badge.description}>
            <Chip
              style={[styles.badge, { backgroundColor: badge.color }]}
              onPress={() => {}}
            >
              {badge.name}
            </Chip>
          </Tooltip>
        );
      })}
    </View>
  );
};
