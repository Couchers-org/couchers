import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { ListEventOrganizersRes } from "proto/events_pb";
import { eventOrganisersKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import EventUsers from "./EventUsers";

interface EventOrganisersProps {
  eventId: number;
}

export default function EventOrganisers({ eventId }: EventOrganisersProps) {
  const {
    data,
    error: organiserIdsError,
    hasNextPage,
    isLoading: isOrganisersIdsLoading,
  } = useInfiniteQuery<ListEventOrganizersRes.AsObject, GrpcError>({
    queryKey: eventOrganisersKey({ eventId, type: "summary" }),
    queryFn: () => service.events.listEventOrganisers(eventId),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const organiserIds =
    data?.pages.flatMap((res) => res.organizerUserIdsList) ?? [];
  const { data: organisers, isLoading: isOrganisersLoading } =
    useUsers(organiserIds);

  return (
    <EventUsers
      error={organiserIdsError}
      hasNextPage={hasNextPage}
      isLoading={isOrganisersIdsLoading || isOrganisersLoading}
      users={organisers}
      userIds={data?.pages.flatMap((page) => page.organizerUserIdsList) ?? []}
    />
  );
}
