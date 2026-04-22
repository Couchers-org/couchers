import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Chip, Skeleton, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { COMMUNITIES, PUBLIC_TRIPS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { PublicTripStatus } from "proto/public_trips_pb";
import { useMemo, useState } from "react";
import dayjs from "utils/dayjs";

import BetaFlag from "../../components/BetaFlag";
import PublicTripCard from "./PublicTripCard";
import { useListPublicTripsByUser } from "./useListPublicTrips";

type TripFilter = "all" | "active" | "past" | "closed";

const PageWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: theme.breakpoints.values.md,
  width: "100%",
  marginInline: "auto",
  flex: 1,
  display: "flex",
  flexDirection: "column",
}));

const EmptyState = styled("div")(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: "var(--mui-palette-text-secondary)",
}));

const TripsList = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const PaginationRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(2),
}));

const TitleRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const FilterRow = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  flexWrap: "wrap",
  marginBottom: theme.spacing(2),
}));

const StyledBackButton = styled(HeaderButton)({
  width: "3.125rem",
  height: "3.125rem",
});

// @TODO(NA): Shouldn't be able to edit a public trip that's closed.
// @TODO(NA): Also consider should a user be able to reopen a closed public trip if it's not in the past?
// @TODO(NA): Add tests for edit flow.

export default function MyPublicTripsPage() {
  const { t } = useTranslation([PUBLIC_TRIPS, COMMUNITIES]);
  const { authState } = useAuthContext();
  const userId = authState.userId;
  const router = useRouter();

  // Stack of page tokens visited so far. First entry is "" (the initial page).
  const [tokens, setTokens] = useState<string[]>([""]);
  const [filter, setFilter] = useState<TripFilter>("all");
  const pageIndex = tokens.length - 1;
  const currentToken = tokens[pageIndex];

  const { data, error, isLoading } = useListPublicTripsByUser(
    userId ?? 0,
    currentToken,
  );

  const filteredTrips = useMemo(() => {
    const trips = data?.publicTripsList ?? [];
    const startOfToday = dayjs().startOf("day");
    return trips.filter((trip) => {
      const isClosed =
        trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED;
      const isPast = dayjs(trip.toDate).isBefore(startOfToday);
      switch (filter) {
        case "active":
          return !isClosed && !isPast;
        case "past":
          return isPast;
        case "closed":
          return isClosed;
        case "all":
        default:
          return true;
      }
    });
  }, [data?.publicTripsList, filter]);

  const goNext = () => {
    if (data?.nextPageToken) {
      setTokens([...tokens, data.nextPageToken]);
    }
  };

  const goPrev = () => {
    if (pageIndex > 0) {
      setTokens(tokens.slice(0, -1));
    }
  };

  const trips = data?.publicTripsList ?? [];
  const hasResults = trips.length > 0;

  const filters: { value: TripFilter; label: string }[] = [
    { value: "all", label: t("publicTrips:filter_all") },
    { value: "active", label: t("publicTrips:filter_active") },
    { value: "past", label: t("publicTrips:filter_past") },
    { value: "closed", label: t("publicTrips:filter_closed") },
  ];

  return (
    <PageWrapper>
      <HtmlMeta title={t("publicTrips:my_title")} />
      <TitleRow>
        <StyledBackButton
          onClick={() => router.back()}
          aria-label={t("communities:previous_page")}
        >
          <BackIcon />
        </StyledBackButton>
        <Typography variant="h1">{t("publicTrips:my_title")}</Typography>
        <BetaFlag />
      </TitleRow>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <TripsList>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={180}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </TripsList>
      ) : (
        <>
          {hasResults && (
            <FilterRow>
              {filters.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => setFilter(f.value)}
                  color={filter === f.value ? "primary" : "default"}
                  variant={filter === f.value ? "filled" : "outlined"}
                />
              ))}
            </FilterRow>
          )}
          <TripsList>
            {!hasResults ? (
              <EmptyState>
                <Typography variant="body1">
                  {t("publicTrips:my_empty_state")}
                </Typography>
              </EmptyState>
            ) : filteredTrips.length === 0 ? (
              <EmptyState>
                <Typography variant="body1">
                  {t("publicTrips:my_filter_empty_state")}
                </Typography>
              </EmptyState>
            ) : (
              filteredTrips.map((trip) => (
                <PublicTripCard key={trip.tripId} trip={trip} ownerView />
              ))
            )}
          </TripsList>
          {hasResults && (
            <PaginationRow>
              <Button
                onClick={goPrev}
                disabled={pageIndex === 0}
                startIcon={<ChevronLeft />}
              >
                {t("publicTrips:previous")}
              </Button>
              <Typography variant="body2">
                {t("publicTrips:page_indicator", {
                  current: pageIndex + 1,
                })}
              </Typography>
              <Button
                onClick={goNext}
                disabled={!data?.nextPageToken}
                endIcon={<ChevronRight />}
              >
                {t("publicTrips:next")}
              </Button>
            </PaginationRow>
          )}
        </>
      )}
    </PageWrapper>
  );
}
