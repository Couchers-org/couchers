import React from 'react';
import { FlatList } from 'react-native';
import useUsers from "@/features/userQueries/useUser";
import ReferenceListItem from "./ReferenceListItem";
import { ListReferencesRes, Reference } from "@/proto/references_pb";

interface ReferenceListProps {
  isReceived?: boolean;
  referencePages: ListReferencesRes.AsObject[];
  referenceUsers: ReturnType<typeof useUsers>["data"];
}

export default function ReferenceList({
  isReceived,
  referencePages,
  referenceUsers,
}: ReferenceListProps) {
  const flattenedReferences = referencePages
    .flatMap((page) => page.referencesList)
    .filter((reference) => {
      const userToShow = referenceUsers?.get(
        isReceived ? reference.fromUserId : reference.toUserId
      );
      return userToShow != null;
    });

  const renderItem = ({ item: reference }: { item: Reference.AsObject }) => {
    const userToShow = referenceUsers?.get(
      isReceived ? reference.fromUserId : reference.toUserId
    );
    return (
      <ReferenceListItem
        isReceived={!!isReceived}
        user={userToShow!}
        reference={reference}
      />
    );
  };

  return (
    <FlatList
      scrollEnabled={false}
      data={flattenedReferences}
      renderItem={renderItem}
      keyExtractor={(item) => item.referenceId.toString()}
    />
  );
}
