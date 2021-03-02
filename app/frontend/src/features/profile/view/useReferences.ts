import { Error as GrpcError } from "grpc-web";
import { useQuery } from "react-query";

import { Reference, User } from "../../../pb/api_pb";
import { service } from "../../../service";
import { timestamp2Date } from "../../../utils/date";
import useUsers from "../../userQueries/useUsers";
import { referencesQueryStaleTime } from "../constants";

export default function useReferences(user: User.AsObject) {
  const referencesQuery = useQuery<Reference.AsObject[], GrpcError>({
    queryKey: ["references", { userId: user.userId }],
    queryFn: async () => {
      const referenceResponses = await Promise.all([
        service.user.getReferencesReceived({
          count: 50,
          userId: user.userId,
          offset: 0,
        }),
        service.user.getReferencesGiven({
          count: 50,
          userId: user.userId,
          offset: 0,
        }),
      ]);
      const references = referenceResponses
        .map((referenceResponse) => referenceResponse.referencesList)
        .flat();
      references.sort(
        (firstRef, secondRef) =>
          timestamp2Date(secondRef.writtenTime!).valueOf() -
          timestamp2Date(firstRef.writtenTime!).valueOf()
      );
      return references;
    },
    staleTime: referencesQueryStaleTime,
  });

  const userIds =
    referencesQuery.data?.map((r) =>
      r.fromUserId === user.userId ? r.toUserId : r.fromUserId
    ) ?? [];

  const { data: referenceUsers, isLoading: isReferenceUsersLoading } = useUsers(
    userIds
  );

  return {
    error: referencesQuery.error,
    isLoading: referencesQuery.isLoading || isReferenceUsersLoading,
    references: referencesQuery.data,
    referenceUsers,
  };
}
