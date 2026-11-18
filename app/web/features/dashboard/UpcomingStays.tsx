import { Luggage, MeetingRoom, SvgIconComponent } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { HostRequest } from "proto/requests_pb";
import { routeToEditProfile, searchRoute } from "routes";
import { theme } from "theme";

import DashboardSectionHeader from "./DashboardSectionHeader";
import UpcomingStayCard, { UpcomingStayCardSkeleton } from "./UpcomingStayCard";
import useGetDashboard from "./useGetDashboard";

interface UpcomingStaysWidgetProps {
  icon: SvgIconComponent;
  title: string;
  requests: HostRequest.AsObject[];
  isLoading: boolean;
  emptyMessage: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}

const CARD_WIDTH = 220;

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

function UpcomingStaysWidget({
  icon,
  title,
  requests,
  isLoading,
  emptyMessage,
  emptyCtaLabel,
  emptyCtaHref,
}: UpcomingStaysWidgetProps) {
  const track = useCardTrack();

  return (
    <section>
      <DashboardSectionHeader icon={icon} title={title} count={isLoading ? 0 : requests.length} {...track.navProps} />

      {isLoading ? (
        <CardTrack cardWidth={CARD_WIDTH}>
          {[0, 1, 2].map((i) => (
            <UpcomingStayCardSkeleton key={i} />
          ))}
        </CardTrack>
      ) : requests.length === 0 ? (
        <EmptyStateRow>
          <Typography variant="body2" sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}>
            {emptyMessage}
          </Typography>
          <Link href={emptyCtaHref} style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "var(--mui-palette-primary-main)",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {emptyCtaLabel} →
            </Typography>
          </Link>
        </EmptyStateRow>
      ) : (
        <CardTrack track={track} cardWidth={CARD_WIDTH}>
          {requests.map((r) => (
            <UpcomingStayCard key={r.hostRequestId} hostRequest={r} />
          ))}
        </CardTrack>
      )}
    </section>
  );
}

export default function UpcomingStays() {
  const { t } = useTranslation([DASHBOARD]);
  const {
    data: { upcomingTrips, upcomingGuests } = { upcomingTrips: [], upcomingGuests: [] },
    isLoading,
    error,
  } = useGetDashboard((dashboard) => ({
    upcomingTrips: dashboard.surfing?.hostRequestsList ?? [],
    upcomingGuests: dashboard.hosting?.hostRequestsList ?? [],
  }));

  return (
    <div>
      {error && <Alert severity="error">{error.message}</Alert>}

      <UpcomingStaysWidget
        icon={MeetingRoom}
        title={t("dashboard:stays.upcoming_guests_header")}
        requests={upcomingGuests}
        isLoading={isLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_guests")}
        emptyCtaLabel={t("dashboard:become_a_host")}
        emptyCtaHref={`${routeToEditProfile("about")}#preferences`}
      />

      <Box sx={{ height: theme.spacing(3) }} />

      <UpcomingStaysWidget
        icon={Luggage}
        title={t("dashboard:stays.upcoming_trips_header")}
        requests={upcomingTrips}
        isLoading={isLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_trips")}
        emptyCtaLabel={t("dashboard:find_a_host")}
        emptyCtaHref={searchRoute}
      />
    </div>
  );
}
