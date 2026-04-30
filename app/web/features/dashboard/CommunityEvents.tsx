import { styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { ListMyEventsRes } from "proto/events_pb";
import { eventsRoute } from "routes";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { myCommunityEventsKey } from "../queryKeys";
import EventListRow, {
  EventListContainer,
  EventListRowSkeleton,
} from "./EventListRow";

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const LoadMoreContainer = styled("div")({
  display: "flex",
  justifyContent: "center",
  marginTop: "12px",
});

const PAGE_SIZE = 5;

export default function CommunityEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const { data, error, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery<ListMyEventsRes.AsObject, RpcError>({
      queryKey: myCommunityEventsKey("upcoming"),
      queryFn: ({ pageParam }) =>
        service.events.listMyEvents({
          pageToken: pageParam as string | undefined,
          pageSize: PAGE_SIZE,
          myCommunities: true,
          myCommunitiesExcludeGlobal: true,
        }),
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
      initialPageParam: undefined,
    });

  return (
    <div>
      <SectionHeader>
        <Typography variant="h2">
          {t("dashboard:events.community_header")}
        </Typography>
        <StyledLink href={`${eventsRoute}#discover`}>
          {t("dashboard:events.see_all_link")}
        </StyledLink>
      </SectionHeader>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <EventListContainer>
          {[0, 1, 2, 3].map((i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </EventListContainer>
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <EventListContainer>
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => (
                <EventListRow key={event.eventId} event={event} />
              ))}
          </EventListContainer>
          {hasNextPage && (
            <LoadMoreContainer>
              <Button onClick={() => fetchNextPage()} loading={isFetching}>
                {t("dashboard:load_more")}
              </Button>
            </LoadMoreContainer>
          )}
        </>
      ) : (
        !error && (
          <TextBody>{t("dashboard:events.community_empty_message")}</TextBody>
        )
      )}
    </div>
  );
}
