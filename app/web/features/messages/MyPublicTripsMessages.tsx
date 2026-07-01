import { ExpandMore, Place } from "@mui/icons-material";
import { Collapse, IconButton, List, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextBody from "components/TextBody";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import { useListPublicTripsByUser } from "features/publicTrips/useListPublicTrips";
import { messageThreadsListKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import {
  HostRequestThread,
  ListMessageThreadsRes,
  MessageThreadFilter,
} from "proto/conversations_pb";
import { PublicTrip } from "proto/public_trips_pb";
import React, { useEffect, useState } from "react";
import { routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";
import { localizeDateTimeRange, numNights, UTC_TIMEZONE } from "utils/date";
import dayjs from "utils/dayjs";

const OFFERS_PAGE_SIZE = 50;

const StyledGroupHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.25, 0),
  borderTop: "1px solid var(--mui-palette-divider)",
}));

const StyledTallyContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(0.75),
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
}));

const StyledTally = styled("span")(({ theme }) => ({
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0, 1),
  borderRadius: 16,
  fontSize: "0.75rem",
  fontWeight: 500,
}));

const StyledDot = styled("span")({
  width: 8,
  height: 8,
  borderRadius: "50%",
});

const StyledHostRequestListItem = styled(HostRequestListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

function guardMenuNavigation(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest("button") || target.closest('[role="menu"]')) {
    e.preventDefault();
  }
}

function TripTally({ trip }: { trip: PublicTrip.AsObject }) {
  const { t } = useTranslation(MESSAGES);
  const tally = trip.offerTally;
  if (!tally) return null;
  return (
    <StyledTallyContainer>
      {tally.pending > 0 && (
        <StyledTally
          sx={{
            backgroundColor: "var(--mui-palette-action-hover)",
            color: "var(--mui-palette-text-secondary)",
          }}
        >
          <StyledDot sx={{ backgroundColor: "var(--mui-palette-grey-500)" }} />
          {t("my_public_trips.tally_pending", { count: tally.pending })}
        </StyledTally>
      )}
      {tally.accepted > 0 && (
        <StyledTally
          sx={{
            backgroundColor: "rgba(26, 195, 2, 0.12)",
            color: "var(--mui-palette-success-main)",
          }}
        >
          <StyledDot
            sx={{ backgroundColor: "var(--mui-palette-success-main)" }}
          />
          {t("my_public_trips.tally_accepted", { count: tally.accepted })}
        </StyledTally>
      )}
      {tally.declined > 0 && (
        <StyledTally
          sx={{
            backgroundColor: "rgba(255, 0, 0, 0.08)",
            color: "var(--mui-palette-error-main)",
          }}
        >
          <StyledDot
            sx={{ backgroundColor: "var(--mui-palette-error-main)" }}
          />
          {t("my_public_trips.tally_declined", { count: tally.declined })}
        </StyledTally>
      )}
    </StyledTallyContainer>
  );
}

export default function MyPublicTripsMessages() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(MESSAGES);
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.userId;

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
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS,
        pageToken: pageParam as string | undefined,
        count: OFFERS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.noMore || !lastPage.nextPageToken
        ? undefined
        : lastPage.nextPageToken,
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
        .filter((hr): hr is HostRequestThread.AsObject => hr !== undefined),
    ) ?? [];

  const offersByTrip = new Map<number, HostRequestThread.AsObject[]>();
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
      {tripGroups.map((trip) => {
        const tripOffers = offersByTrip.get(trip.tripId) ?? [];
        const isCollapsed = collapsed.has(trip.tripId);
        return (
          <div key={trip.tripId}>
            <StyledGroupHeader>
              <IconButton
                size="small"
                aria-label={t("my_public_trips.toggle_group")}
                onClick={() => toggle(trip.tripId)}
              >
                <ExpandMore
                  sx={{
                    transition: "transform 0.2s",
                    transform: isCollapsed ? "rotate(-90deg)" : "none",
                  }}
                />
              </IconButton>
              <Place sx={{ color: "var(--mui-palette-primary-dark)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h3" noWrap>
                  {trip.communityName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {localizeDateTimeRange(
                    dayjs.tz(trip.fromDate, UTC_TIMEZONE),
                    dayjs.tz(trip.toDate, UTC_TIMEZONE),
                    { timezone: UTC_TIMEZONE, locale, includeTime: false },
                  )}
                  {" · "}
                  {t("my_public_trips.nights", {
                    count: numNights(trip.toDate, trip.fromDate),
                  })}
                  {" · "}
                  {t("my_public_trips.offers", { count: tripOffers.length })}
                </Typography>
              </div>
              <TripTally trip={trip} />
            </StyledGroupHeader>
            <Collapse in={!isCollapsed} mountOnEnter unmountOnExit>
              <List sx={{ width: "100%" }}>
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
          </div>
        );
      })}
    </div>
  );
}
