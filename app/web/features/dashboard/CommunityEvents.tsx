import { Event } from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";

import { routeToNewEvent } from "../../routes";
import DashboardSectionHeader from "./DashboardSectionHeader";
import EventListRow, { EventListContainer, EventListRowSkeleton } from "./EventListRow";
import useGetDashboard, { DASHBOARD_PAGE_SIZE } from "./useGetDashboard";

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

export default function CommunityEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const {
    data: items = [],
    error,
    isLoading,
  } = useGetDashboard((dashboard) => dashboard.communityEvents?.eventsList ?? []);

  const currentItems = items.slice(
    currentPageIndex * DASHBOARD_PAGE_SIZE,
    (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE,
  );
  const hasPreviousPage = currentPageIndex > 0;
  const hasNextPage = (currentPageIndex + 1) * DASHBOARD_PAGE_SIZE < items.length;

  return (
    <div>
      <DashboardSectionHeader
        icon={Event}
        title={t("dashboard:events.community_header")}
        hasPrevious={hasPreviousPage}
        hasNext={hasNextPage}
        onPrevious={() => setCurrentPageIndex((i) => i - 1)}
        onNext={() => setCurrentPageIndex((i) => i + 1)}
      />
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
