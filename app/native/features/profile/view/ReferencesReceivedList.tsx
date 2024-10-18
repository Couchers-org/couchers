import useUsers from "@/features/userQueries/useUser";

import { useReferencesReceived } from "@/features/profile/hooks/referencesHooks";
import { ReferenceTypeState } from "./References";
import { User } from "@/proto/api_pb";
import ReferencesView from "./ReferencesView";

interface ReferencesReceivedListProps {
  referenceType: Exclude<ReferenceTypeState, "given">;
  user: User.AsObject;
}

export default function ReferencesReceivedList({
  referenceType,
  user,
}: ReferencesReceivedListProps) {
  const referencesReceivedQuery = useReferencesReceived(user, referenceType);

  const userIds =
    referencesReceivedQuery.data?.pages
      .map((page) =>
        page.referencesList.map((reference) => reference.fromUserId)
      )
      .flat() ?? [];
  const { data: referenceUsers, isLoading: isReferenceUsersLoading } =
    useUsers(userIds);

  return (
    <ReferencesView
      isReceived
      isReferenceUsersLoading={isReferenceUsersLoading}
      referenceUsers={referenceUsers}
      referencesQuery={referencesReceivedQuery}
    />
  );
}
