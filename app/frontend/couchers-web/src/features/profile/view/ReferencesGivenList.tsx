import useUsers from "features/userQueries/useUsers";

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
    useUsers(userIds);

  return (
    <ReferencesView
      isReferenceUsersLoading={isReferenceUsersLoading}
      referencesQuery={referencesGivenQuery}
      referenceUsers={referenceUsers}
    />
  );
}
