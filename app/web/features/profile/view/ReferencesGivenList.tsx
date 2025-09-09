import { useReferencesGiven } from "@/features/profile/hooks/referencesHooks";
import { useProfileUser } from "@/features/profile/hooks/useProfileUser";
import { useLiteUsers } from "@/features/userQueries/useLiteUsers";

import ReferencesView from "./ReferencesView";

const ReferencesGivenList = () => {
  const user = useProfileUser();
  const referencesGivenQuery = useReferencesGiven(user);

  const userIds =
    referencesGivenQuery.data?.pages
      .map((page) => page.referencesList.map((reference) => reference.toUserId))
      .flat() ?? [];
  const { data: referenceUsers, isLoading: isReferenceUsersLoading } =
    useLiteUsers(userIds);

  return (
    <ReferencesView
      isReferenceUsersLoading={isReferenceUsersLoading}
      referencesQuery={referencesGivenQuery}
      referenceUsers={referenceUsers}
    />
  );
};

export default ReferencesGivenList;
