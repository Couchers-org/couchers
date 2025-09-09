import { useReferencesReceived } from "@/features/profile/hooks/referencesHooks";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { useLiteUsers } from "@/features/userQueries/useLiteUsers";

import { ReferenceTypeState } from "./References";
import ReferencesView from "./ReferencesView";

interface ReferencesReceivedListProps {
  referenceType: Exclude<ReferenceTypeState, "given">;
}

const ReferencesReceivedList = ({
  referenceType,
}: ReferencesReceivedListProps) => {
  const user = useProfileUser();
  const referencesReceivedQuery = useReferencesReceived(user, referenceType);

  const userIds =
    referencesReceivedQuery.data?.pages
      .map((page) =>
        page.referencesList.map((reference) => reference.fromUserId),
      )
      .flat() ?? [];
  const { data: referenceUsers, isLoading: isReferenceUsersLoading } =
    useLiteUsers(userIds);

  return (
    <ReferencesView
      isReceived
      isReferenceUsersLoading={isReferenceUsersLoading}
      referenceUsers={referenceUsers}
      referencesQuery={referencesReceivedQuery}
    />
  );
};

export default ReferencesReceivedList;
