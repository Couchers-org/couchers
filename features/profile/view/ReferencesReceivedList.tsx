import useUsers from "features/userQueries/useUsers";

import { useReferencesReceived } from "../hooks/referencesHooks";
import { useProfileUser } from "../hooks/useProfileUser";
import { ReferenceTypeState } from "./References";
import ReferencesView from "./ReferencesView";

interface ReferencesReceivedListProps {
  referenceType: Exclude<ReferenceTypeState, "given">;
}

export default function ReferencesReceivedList({
  referenceType,
}: ReferencesReceivedListProps) {
  const user = useProfileUser();
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
