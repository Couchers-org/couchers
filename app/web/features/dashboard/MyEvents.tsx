import { styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { ListMyEventsRes } from "proto/events_pb";
import { eventsRoute, routeToNewEvent } from "routes";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { myEventsKey } from "../queryKeys";
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

const PAGE_SIZE = 3;

export default function MyUpcomingEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const { data, error, isLoading } = useInfiniteQuery<
    ListMyEventsRes.AsObject,
    RpcError
  >({
    queryKey: myEventsKey("upcoming"),
    queryFn: ({ pageParam }) =>
      service.events.listMyEvents({
        pageToken: pageParam as string | undefined,
        pageSize: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });

  return (
    <div>
      <SectionHeader>
        <Typography variant="h2">
          {t("dashboard:your_upcoming_events")}
        </Typography>
        <StyledLink href={eventsRoute}>
          {t("dashboard:see_all_events")}
        </StyledLink>
      </SectionHeader>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <EventListContainer>
          {[0, 1, 2].map((i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </EventListContainer>
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <EventListContainer>
          {data.pages
            .flatMap((page) => page.eventsList)
            .slice(0, PAGE_SIZE)
            .map((event) => (
              <EventListRow key={event.eventId} event={event} />
            ))}
        </EventListContainer>
      ) : (
        !error && (
          <TextBody>
            <Trans
              t={t}
              i18nKey="dashboard:events_empty_state"
              components={[
                <StyledLink key="create-link" href={routeToNewEvent()} />,
              ]}
            />
          </TextBody>
        )
      )}
    </div>
  );
}
