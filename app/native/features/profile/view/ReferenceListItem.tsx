import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useTranslation } from "@/i18n";
import { COMMUNITIES, GLOBAL } from "@/i18n/namespaces";
import { User } from "@/proto/api_pb";
import { Reference } from "@/proto/references_pb";
import TextBody from "@/components/TextBody";
import { referenceBadgeLabel } from "features/profile/constants";
import { dateTimeFormatter, timestamp2Date } from "utils/date";
import UserSummary from "@/components/UserSummary";
import { routeToUser } from "@/routes";
import { router } from "expo-router";

const styles = StyleSheet.create({
  listItem: {
  },
  referenceBodyContainer: {
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  referenceText: {
  },
  pill: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 12,
    color: '#333',
  },
});

const Pill = ({ children, style }: any) => (
  <View style={[styles.pill, style]}>
    <Text style={styles.pillText}>{children}</Text>
  </View>
);

export const REFERENCE_LIST_ITEM_TEST_ID = "reference-list-item";

interface ReferenceListItemProps {
  isReceived: boolean;
  user: User.AsObject;
  reference: Reference.AsObject;
}

export default function ReferenceListItem({
  isReceived,
  user,
  reference,
}: ReferenceListItemProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);

  return (
    <TouchableOpacity
      style={styles.listItem}
      testID={REFERENCE_LIST_ITEM_TEST_ID}
      onPress={() => {
        router.push(routeToUser(user.username, 'about') as any);
      }}
    >
      <UserSummary user={user} />
      <View style={styles.referenceBodyContainer}>
        <View style={styles.badgesContainer}>
          {isReceived && (
            <Pill>
              {referenceBadgeLabel(t)[reference.referenceType]}
            </Pill>
          )}
          {reference.writtenTime && (
            <Pill>
              {dateTimeFormatter(locale).format(
                timestamp2Date(reference.writtenTime)
              )}
            </Pill>
          )}
        </View>
        <TextBody style={styles.referenceText}>{reference.text}</TextBody>
      </View>
    </TouchableOpacity>
  );
}
