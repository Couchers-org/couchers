import {
  ArrowBack,
  ArrowForward,
  EventOutlined,
  Luggage,
  MeetingRoom,
  PlaceOutlined,
} from "@mui/icons-material";
import { Box, IconButton, Skeleton, styled, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import { useAuthContext } from "features/auth/AuthProvider";
import { hostRequestsListKey } from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { HostRequestStatus } from "proto/conversations_pb";
import { HostRequest, ListHostRequestsRes } from "proto/requests_pb";
import { useEffect, useRef, useState } from "react";
import { routeToEditProfile, routeToHostRequest, searchRoute } from "routes";
import { service } from "service";
import { theme } from "theme";
import { localizeDateTimeRange, UTC_TIMEZONE } from "utils/date";
import dayjs from "utils/dayjs";
import { firstName } from "utils/names";

type Kind = "trip" | "guest";

const CARD_WIDTH = 220;
const CARD_GAP = 12;

const ACCEPTED_STATUSES = new Set([
  HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
  HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED,
]);

function filterUpcoming(
  requests: HostRequest.AsObject[],
): HostRequest.AsObject[] {
  const today = dayjs().startOf("day");
  return requests
    .filter(
      (r) =>
        ACCEPTED_STATUSES.has(r.status) &&
        dayjs(r.fromDate).diff(today, "day") >= 0,
    )
    .sort((a, b) => dayjs(a.fromDate).diff(dayjs(b.fromDate)));
}

// ── Styled components ──────────────────────────────────────────────────────

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(1.5),
  minHeight: 28,
});

const Track = styled(Box)({
  display: "flex",
  gap: `${CARD_GAP}px`,
  overflowX: "auto",
  scrollSnapType: "x proximity",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

const StyledCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1.5),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-background-paper)",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s",
  height: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
}));

const DaysChip = styled("span")<{ imminent: boolean }>(
  ({ theme, imminent }) => ({
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: "2px 8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginLeft: "auto",
    background: imminent
      ? alpha(theme.palette.secondary.main, 0.12)
      : "var(--mui-palette-grey-50)",
    color: imminent
      ? "var(--mui-palette-secondary-dark)"
      : "var(--mui-palette-text-secondary)",
  }),
);

const IdentityRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

const TextBlock = styled("div")({
  minWidth: 0,
});

const MetaRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: "1px dashed var(--mui-palette-divider)",
}));

const MetaDate = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  fontSize: 12,
  fontWeight: 500,
  color: "var(--mui-palette-text-primary)",
  minWidth: 0,
  overflow: "hidden",
}));

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

// ── UpcomingStayCard ───────────────────────────────────────────────────────

interface UpcomingStayCardProps {
  hostRequest: HostRequest.AsObject;
  kind: Kind;
}

function daysUntilLabel(
  days: number,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (days === 0) return t("dashboard:stays.today_label");
  if (days === 1) return t("dashboard:stays.tomorrow_label");
  if (days <= 7) return t("dashboard:stays.in_n_days_label", { count: days });
  if (days <= 14) return t("dashboard:stays.next_week_label");
  return t("dashboard:stays.in_n_days_label", { count: days });
}

function UpcomingStayCard({ hostRequest, kind }: UpcomingStayCardProps) {
  const { authState } = useAuthContext();
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([DASHBOARD]);

  const isHost = authState.userId === hostRequest.hostUserId;
  const otherUserId = isHost
    ? hostRequest.surferUserId
    : hostRequest.hostUserId;
  const { data: otherUser, isLoading } = useLiteUser(otherUserId);

  const fromDate = dayjs.tz(hostRequest.fromDate, UTC_TIMEZONE);
  const toDate = dayjs.tz(hostRequest.toDate, UTC_TIMEZONE);
  const nights = toDate.diff(fromDate, "day");
  const daysUntil = fromDate.diff(dayjs().startOf("day"), "day");
  const isImminent = daysUntil <= 3;

  const dateRange = localizeDateTimeRange(fromDate, toDate, {
    timezone: UTC_TIMEZONE,
    locale,
    includeTime: false,
    abbreviate: true,
  });

  const cityName = (city: string | undefined) =>
    city?.split(",")[0].trim() ?? "—";

  const primary = isLoading ? (
    <Skeleton width={80} />
  ) : kind === "trip" ? (
    cityName(otherUser?.city)
  ) : (
    (otherUser?.name ?? "—")
  );

  const secondary = isLoading ? (
    <Skeleton width={60} />
  ) : kind === "trip" ? (
    t("dashboard:stays.with_name", { name: firstName(otherUser?.name) })
  ) : (
    t("dashboard:stays.from_city", { city: cityName(otherUser?.city) })
  );

  return (
    <Link
      href={routeToHostRequest(hostRequest.hostRequestId)}
      style={{
        display: "flex",
        textDecoration: "none",
        color: "inherit",
        height: "100%",
        width: "100%",
      }}
    >
      <StyledCard sx={{ flex: 1 }}>
        <IdentityRow>
          {kind === "trip" ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                border: "1px solid var(--mui-palette-divider)",
                background: "var(--mui-palette-grey-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PlaceOutlined
                sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
              />
            </Box>
          ) : (
            <Avatar user={otherUser} isProfileLink={false} />
          )}
          <TextBlock>
            <Typography
              variant="h3"
              noWrap
              sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}
            >
              {primary}
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontSize: 12, color: "var(--mui-palette-text-secondary)" }}
            >
              {secondary}
            </Typography>
          </TextBlock>
          {isImminent && (
            <DaysChip imminent>{daysUntilLabel(daysUntil, t)}</DaysChip>
          )}
        </IdentityRow>
        <MetaRow>
          <MetaDate>
            <EventOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {dateRange}
            </span>
          </MetaDate>
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontSize: 12,
              color: "var(--mui-palette-text-secondary)",
              flexShrink: 0,
            }}
          >
            {t("dashboard:stays.night_count", { count: nights })}
          </Typography>
        </MetaRow>
      </StyledCard>
    </Link>
  );
}

function UpcomingStayCardSkeleton() {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: "10px",
        background: "var(--mui-palette-background-paper)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, pr: 7.5, mb: 1.5 }}>
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton height={16} sx={{ mb: 0.5 }} />
          <Skeleton height={12} width="60%" />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: 1.25,
          borderTop: "1px dashed var(--mui-palette-divider)",
        }}
      >
        <Skeleton height={14} width={90} />
        <Skeleton height={14} width={50} />
      </Box>
    </Box>
  );
}

// ── UpcomingStaysWidget ────────────────────────────────────────────────────

interface UpcomingStaysWidgetProps {
  kind: Kind;
  icon: React.ReactNode;
  title: string;
  requests: HostRequest.AsObject[];
  isLoading: boolean;
  emptyMessage: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}

function UpcomingStaysWidget({
  icon,
  title,
  requests,
  isLoading,
  kind,
  emptyMessage,
  emptyCtaLabel,
  emptyCtaHref,
}: UpcomingStaysWidgetProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
  }, [requests.length, isLoading]);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: dir * (CARD_WIDTH + CARD_GAP) * 2,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          {icon}
          {title}
          {!isLoading && requests.length > 0 && (
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--mui-palette-text-secondary)",
                background: "var(--mui-palette-grey-50)",
                borderRadius: 999,
                px: 1.125,
                lineHeight: "20px",
                display: "inline-block",
              }}
            >
              {requests.length}
            </Box>
          )}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            color={canScrollLeft ? "primary" : "default"}
            aria-label="Previous"
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            color={canScrollRight ? "primary" : "default"}
            aria-label="Next"
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>

      {isLoading ? (
        <Track>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}
            >
              <UpcomingStayCardSkeleton />
            </Box>
          ))}
        </Track>
      ) : requests.length === 0 ? (
        <EmptyStateRow>
          <Typography
            variant="body2"
            sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}
          >
            {emptyMessage}
          </Typography>
          <Link
            href={emptyCtaHref}
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "var(--mui-palette-primary-dark)",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {emptyCtaLabel} →
            </Typography>
          </Link>
        </EmptyStateRow>
      ) : (
        <Track ref={scrollerRef} onScroll={updateScrollState}>
          {requests.map((r) => (
            <Box
              key={r.hostRequestId}
              sx={{
                flex: `0 0 ${CARD_WIDTH}px`,
                minWidth: 0,
                scrollSnapAlign: "start",
              }}
            >
              <UpcomingStayCard hostRequest={r} kind={kind} />
            </Box>
          ))}
        </Track>
      )}
    </section>
  );
}

// ── UpcomingStays (default export) ─────────────────────────────────────────

export default function UpcomingStays() {
  const { t } = useTranslation([DASHBOARD]);

  const {
    data: tripsData,
    isLoading: tripsLoading,
    error: tripsError,
  } = useQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({ type: "surfing" }),
    queryFn: () =>
      service.requests.listHostRequests({
        type: "surfing",
        count: 20,
      }),
  });

  const {
    data: guestsData,
    isLoading: guestsLoading,
    error: guestsError,
  } = useQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({ type: "hosting" }),
    queryFn: () =>
      service.requests.listHostRequests({
        type: "hosting",
        count: 20,
      }),
  });

  const upcomingTrips = filterUpcoming(tripsData?.hostRequestsList ?? []);
  const upcomingGuests = filterUpcoming(guestsData?.hostRequestsList ?? []);

  const error = tripsError ?? guestsError;

  return (
    <div>
      {error && <Alert severity="error">{error.message}</Alert>}

      <UpcomingStaysWidget
        kind="trip"
        icon={
          <Luggage
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
        }
        title={t("dashboard:stays.upcoming_trips_header")}
        requests={upcomingTrips}
        isLoading={tripsLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_trips")}
        emptyCtaLabel={t("dashboard:find_a_host")}
        emptyCtaHref={searchRoute}
      />

      <Box sx={{ height: theme.spacing(3) }} />

      <UpcomingStaysWidget
        kind="guest"
        icon={
          <MeetingRoom
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
        }
        title={t("dashboard:stays.upcoming_guests_header")}
        requests={upcomingGuests}
        isLoading={guestsLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_guests")}
        emptyCtaLabel={t("dashboard:become_a_host")}
        emptyCtaHref={routeToEditProfile("about")}
      />
    </div>
  );
}
