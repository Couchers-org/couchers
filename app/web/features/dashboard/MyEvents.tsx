import { ArrowBack, ArrowForward, Event } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";
import { routeToNewEvent } from "routes";

import EventListRow, { EventListContainer, EventListRowSkeleton } from "./EventListRow";
import useGetDashboard, { DASHBOARD_PAGE_SIZE } from "./useGetDashboard";

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

export default function MyUpcomingEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { data: items = [], error, isLoading } = useGetDashboard((dashboard) => dashboard.myEvents?.eventsList ?? []);

  const currentItems = items.slice(
    currentPageIndex * DASHBOARD_PAGE_SIZE,
    (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE,
  );
  const hasPreviousPage = currentPageIndex > 0;
  const hasNextPage = (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE < items.length;

  return (
    <div>
      <SectionHeader>
        <Typography variant="h2" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          <Event sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }} />
          {t("dashboard:events.your_upcoming_header")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i - 1)}
            disabled={!hasPreviousPage}
            color={hasPreviousPage ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i + 1)}
            disabled={!hasNextPage}
            color={hasNextPage ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <EventListContainer>
          {[0, 1, 2].map((i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </EventListContainer>
      ) : currentItems?.length ? (
        <EventListContainer>
          {currentItems.map((event) => (
            <EventListRow key={event.eventId} event={event} />
          ))}
        </EventListContainer>
      ) : (
        !error && (
          <EmptyStateRow>
            <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
              <Trans
                t={t}
                i18nKey="dashboard:events.your_upcoming_empty_message"
                components={{ createEventLink: <StyledLink href={routeToNewEvent()} /> }}
              />
            </Typography>
          </EmptyStateRow>
        )
      )}
    </div>
  );
}
