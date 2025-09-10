import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import {
  QueryType,
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  eventsKey,
  myEventsKey,
} from "@/features/queryKeys";
import {
  Event,
  ListAllEventsRes,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
  ListMyEventsRes,
} from "@/proto/events_pb";
import { EventSearchRes } from "@/proto/search_pb";
import { service } from "@/service";
import type { ListAllEventsInput, ListMyEventsInput } from "@/service/events";
import { GeocodeResult } from "@/utils/hooks";

export interface UseEventUsersInput {
  eventId: number;
  type: QueryType;
  enabled?: boolean;
}

export const SUMMARY_QUERY_PAGE_SIZE = 5;

export const useEventOrganizers = ({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) => {
  const query = useInfiniteQuery<ListEventOrganizersRes.AsObject, RpcError>({
    queryKey: eventOrganizersKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      service.events.listEventOrganizers({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const organizerIds = query.data?.pages.flatMap(
    (res) => res.organizerUserIdsList,
  );

  return { ...query, organizerIds };
};

export const useEventAttendees = ({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) => {
  const query = useInfiniteQuery<ListEventAttendeesRes.AsObject, RpcError>({
    queryKey: eventAttendeesKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      service.events.listEventAttendees({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const attendeesIds = query.data?.pages.flatMap(
    (data) => data.attendeeUserIdsList,
  );
  return {
    ...query,
    attendeesIds,
  };
};

export const useEvent = ({ eventId }: { eventId: number }) => {
  const isValidEventId = eventId > 0;

  const eventQuery = useQuery<Event.AsObject, RpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: isValidEventId,
  });

  return {
    ...eventQuery,
    eventId,
    isValidEventId,
  };
};

export const useListAllEvents = ({
  pastEvents,
  pageSize,
  showCancelled,
}: Omit<ListAllEventsInput, "pageToken">) => {
  return useInfiniteQuery<ListAllEventsRes.AsObject, RpcError>({
    queryKey: [eventsKey(pastEvents ? "past" : "upcoming"), showCancelled],
    queryFn: ({ pageParam }) =>
      service.events.listAllEvents({
        pastEvents,
        pageSize,
        pageToken: pageParam as string | undefined,
        showCancelled,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });
};

export const useListMyEvents = ({
  pastEvents,
  pageNumber,
  pageSize,
  showCancelled,
}: Omit<ListMyEventsInput, "pageToken">) => {
  return useQuery<ListMyEventsRes.AsObject, RpcError>({
    queryKey: [
      myEventsKey(pastEvents ? "past" : "upcoming"),
      pageNumber,
      showCancelled,
    ],
    queryFn: ({ pageParam }) =>
      service.events.listMyEvents({
        pastEvents,
        pageNumber,
        pageSize,
        pageToken: pageParam as string | undefined,
        showCancelled,
      }),
  });
};

export const useEventSearch = ({
  pageNumber,
  pageSize,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
  searchLocation,
}: {
  pageNumber: number;
  pageSize: number;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
  searchLocation?: GeocodeResult | "";
}) => {
  return useQuery<EventSearchRes.AsObject, RpcError>({
    queryKey: [
      "searchEvents",
      isMyCommunities,
      isOnlineOnly,
      pageNumber,
      pastEvents,
      searchLocation,
    ],
    queryFn: () =>
      service.search.eventSearch({
        pageNumber,
        pageSize,
        pastEvents,
        isMyCommunities,
        isOnlineOnly,
        searchLocation,
      }),
  });
};
