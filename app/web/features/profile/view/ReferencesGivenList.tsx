import { useLiteUsers } from "features/userQueries/useLiteUsers";

import { useReferencesGiven } from "../hooks/referencesHooks";
import { useProfileUser } from "../hooks/useProfileUser";
import ReferencesView from "./ReferencesView";

export default function ReferencesGivenList() {
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
}
