import { ArrowBack, ArrowForward, Event } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { ListMyEventsRes } from "proto/events_pb";
import { useState } from "react";
import { service } from "service";

import { routeToNewEvent } from "../../routes";
import { myCommunityEventsKey } from "../queryKeys";
import EventListRow, {
  EventListContainer,
  EventListRowSkeleton,
} from "./EventListRow";

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

const PAGE_SIZE = 5;

export default function CommunityEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const [page, setPage] = useState(1);

  const { data, error, isLoading } = useQuery<
    ListMyEventsRes.AsObject,
    RpcError
  >({
    queryKey: [...myCommunityEventsKey("upcoming"), page],
    queryFn: () =>
      service.events.listMyEvents({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        myCommunities: true,
        myCommunitiesExcludeGlobal: true,
      }),
  });

  const totalItems = data?.totalItems ?? 0;
  const hasNext = page * PAGE_SIZE < totalItems;
  const hasPrev = page > 1;

  return (
    <div>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          <Event
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
          {t("dashboard:events.community_header")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            color={hasPrev ? "primary" : "default"}
            aria-label={t("dashboard:discussions.prev_page_label")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            color={hasNext ? "primary" : "default"}
            aria-label={t("dashboard:discussions.next_page_label")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <EventListContainer>
          {[0, 1, 2, 3].map((i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </EventListContainer>
      ) : data?.eventsList?.length ? (
        <EventListContainer>
          {data.eventsList.map((event) => (
            <EventListRow key={event.eventId} event={event} />
          ))}
        </EventListContainer>
      ) : (
        !error && (
          <EmptyStateRow>
            <Typography
              variant="body2"
              sx={{ color: "var(--mui-palette-text-secondary)" }}
            >
              <Trans
                t={t}
                i18nKey="dashboard:events.your_upcoming_empty_message"
                components={[
                  <StyledLink key="create-link" href={routeToNewEvent()} />,
                ]}
              />
            </Typography>
          </EmptyStateRow>
        )
      )}
    </div>
  );
}
