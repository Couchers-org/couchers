import { ExpandMore, Place, WavingHandOutlined } from "@mui/icons-material";
import { Collapse, List, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { EditIcon } from "components/Icons";
import TextBody from "components/TextBody";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import { useListPublicTripsByUser } from "features/publicTrips/useListPublicTrips";
import { messageThreadsListKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES, PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ListMessageThreadsRes,
  MessageThreadCategory,
} from "proto/conversations_pb";
import { PublicTrip, PublicTripStatus } from "proto/public_trips_pb";
import { HostRequest } from "proto/requests_pb";
import React, { useCallback, useEffect, useState } from "react";
import { myPublicTripsRoute, routeToHostRequest } from "routes";
import { service } from "service";
import { Temporal } from "temporal-polyfill";
import { localizeDateTimeRange } from "utils/date";

const OFFERS_PAGE_SIZE = 50;

// Each trip is a self-contained accordion: a bordered card whose header toggles
// the offers held inside it.
const StyledActions = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: theme.spacing(1.5),
}));

const StyledGroupContainer = styled("div")(({ theme }) => ({
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(2),
  overflow: "hidden",
  backgroundColor: "var(--mui-palette-background-paper)",
}));

const StyledGroupHeader = styled("button")<{ expanded: boolean }>(
  ({ theme, expanded }) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.25, 2),
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    backgroundColor: "var(--mui-palette-grey-50)",
    borderBottom: expanded ? "1px solid var(--mui-palette-divider)" : "none",
    "&:hover": {
      backgroundColor: "var(--mui-palette-action-hover)",
    },
  }),
);

// Total offers indicator, matching the public trips dashboard widget.
const StyledOffersChip = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  flexShrink: 0,
  fontSize: "0.75rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: "var(--mui-palette-primary-dark)",
  "& svg": {
    fontSize: theme.typography.pxToRem(15),
  },
}));

const StyledHostRequestListItem = styled(HostRequestListItem)(({ theme }) => ({
  paddingInline: theme.spacing(2),
}));

function guardMenuNavigation(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest('[role="menu"]')) {
    e.preventDefault();
  }
}

function OffersChip({ count, dimmed }: { count: number; dimmed?: boolean }) {
  const { t } = useTranslation(MESSAGES);
  return (
    <StyledOffersChip
      sx={dimmed ? { color: "var(--mui-palette-grey-500)" } : undefined}
    >
      <WavingHandOutlined />
      {t("my_public_trips.offers", { count })}
    </StyledOffersChip>
  );
}

export default function MyPublicTripsMessages() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([MESSAGES, PUBLIC_TRIPS]);
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.userId;

  // When deep-linked from a trip card ("view offers"), scroll that trip into view.
  const router = useRouter();
  const targetTripId = router.query.trip
    ? Number(router.query.trip)
    : undefined;
  const scrollTargetIntoView = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const {
    data: tripsData,
    isLoading: tripsLoading,
    error: tripsError,
  } = useListPublicTripsByUser({
    userId: userId ?? 0,
    pageToken: "",
    ascending: true,
  });

  const offersQuery = useInfiniteQuery<
    ListMessageThreadsRes.AsObject,
    RpcError
  >({
    queryKey: messageThreadsListKey({
      filter: "public-trips",
      onlyArchived: false,
    }),
    queryFn: ({ pageParam }) =>
      service.conversations.listMessageThreads({
        categories: [
          MessageThreadCategory.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
        ],
        pageToken: pageParam as string | undefined,
        count: OFFERS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    initialPageParam: undefined,
    enabled: !!userId,
  });

  // Load all offer pages so grouping by trip is complete.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = offersQuery;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const offers =
    offersQuery.data?.pages.flatMap((page) =>
      page.threadsList
        .map((thread) => thread.hostRequest)
        .filter((hr): hr is HostRequest.AsObject => hr !== undefined),
    ) ?? [];

  const offersByTrip = new Map<number, HostRequest.AsObject[]>();
  for (const offer of offers) {
    const tripId = offer.publicTripId ?? 0;
    const list = offersByTrip.get(tripId) ?? [];
    list.push(offer);
    offersByTrip.set(tripId, list);
  }

  const tripsById = new Map<number, PublicTrip.AsObject>();
  for (const trip of tripsData?.publicTripsList ?? []) {
    tripsById.set(trip.tripId, trip);
  }

  // Only show trips that have offers, ordered by trip start date (soonest first).
  const tripGroups = Array.from(offersByTrip.keys())
    .map((tripId) => tripsById.get(tripId))
    .filter((trip): trip is PublicTrip.AsObject => trip !== undefined)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggle = (tripId: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });

  if (tripsError) {
    return <Alert severity="error">{tripsError.message}</Alert>;
  }
  if (tripsLoading || offersQuery.isLoading) {
    return <CenteredSpinner />;
  }
  if (tripGroups.length === 0) {
    return <TextBody>{t("my_public_trips.empty_state")}</TextBody>;
  }

  return (
    <div>
      <StyledActions>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          component={Link}
          href={myPublicTripsRoute}
        >
          {t("publicTrips:edit_my_trips")}
        </Button>
      </StyledActions>
      {tripGroups.map((trip) => {
        const tripOffers = offersByTrip.get(trip.tripId) ?? [];
        const isCollapsed = collapsed.has(trip.tripId);
        // Dim closed/past trips, matching how past host requests are shown.
        const isDimmed =
          trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED ||
          Temporal.PlainDate.compare(
            Temporal.PlainDate.from(trip.toDate),
            Temporal.Now.plainDateISO(),
          ) < 0;
        return (
          <StyledGroupContainer
            key={trip.tripId}
            ref={
              trip.tripId === targetTripId ? scrollTargetIntoView : undefined
            }
          >
            <StyledGroupHeader
              expanded={!isCollapsed}
              aria-expanded={!isCollapsed}
              aria-label={t("my_public_trips.toggle_group")}
              onClick={() => toggle(trip.tripId)}
            >
              <ExpandMore
                sx={{
                  color: "var(--mui-palette-text-secondary)",
                  transition: "transform 0.2s",
                  transform: isCollapsed ? "rotate(-90deg)" : "none",
                }}
              />
              <Place
                sx={{
                  color: isDimmed
                    ? "var(--mui-palette-grey-500)"
                    : "var(--mui-palette-primary-dark)",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h3"
                  noWrap
                  sx={
                    isDimmed
                      ? { color: "var(--mui-palette-grey-500)" }
                      : undefined
                  }
                >
                  {trip.communityName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {localizeDateTimeRange(
                    Temporal.PlainDateTime.from(trip.fromDate),
                    Temporal.PlainDateTime.from(trip.toDate),
                    { locale, includeTime: false },
                  )}
                  {" · "}
                  {t("my_public_trips.nights", {
                    count: Temporal.PlainDate.from(trip.toDate).since(
                      Temporal.PlainDate.from(trip.fromDate),
                    ).days,
                  })}
                </Typography>
              </div>
              <OffersChip count={tripOffers.length} dimmed={isDimmed} />
            </StyledGroupHeader>
            <Collapse in={!isCollapsed} mountOnEnter unmountOnExit>
              <List disablePadding sx={{ width: "100%" }}>
                {tripOffers.map((offer) => (
                  <Link
                    key={`offer-${offer.hostRequestId}`}
                    href={routeToHostRequest(offer.hostRequestId)}
                    onClick={guardMenuNavigation}
                  >
                    <StyledHostRequestListItem hostRequest={offer} />
                  </Link>
                ))}
              </List>
            </Collapse>
          </StyledGroupContainer>
        );
      })}
    </div>
  );
}
