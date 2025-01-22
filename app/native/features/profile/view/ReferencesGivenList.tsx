import useUsers from "@/features/userQueries/useUser";

import { useReferencesGiven } from "@/features/profile/hooks/referencesHooks";
import ReferencesView from "./ReferencesView";
import { User } from "@/proto/api_pb";

interface ReferencesGivenListProps {
  user: User.AsObject;
}

export default function ReferencesGivenList({ user }: ReferencesGivenListProps) {
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
