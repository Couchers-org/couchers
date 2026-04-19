import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Skeleton, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";

import PublicTripCard from "./PublicTripCard";
import { useListPublicTripsByUser } from "./useListPublicTrips";

const PageWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: theme.breakpoints.values.md,
  marginInline: "auto",
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

const StyledBackButton = styled(HeaderButton)({
  width: "3.125rem",
  height: "3.125rem",
});

export default function MyPublicTripsPage() {
  const { t } = useTranslation([COMMUNITIES]);
  const { authState } = useAuthContext();
  const userId = authState.userId;
  const router = useRouter();

  // Stack of page tokens visited so far. First entry is "" (the initial page).
  const [tokens, setTokens] = useState<string[]>([""]);
  const pageIndex = tokens.length - 1;
  const currentToken = tokens[pageIndex];

  const { data, error, isLoading } = useListPublicTripsByUser(
    userId ?? 0,
    currentToken,
  );

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

  return (
    <PageWrapper>
      <HtmlMeta title={t("communities:my_public_trips_title")} />
      <TitleRow>
        <StyledBackButton
          onClick={() => router.back()}
          aria-label={t("communities:previous_page")}
        >
          <BackIcon />
        </StyledBackButton>
        <Typography variant="h1">
          {t("communities:my_public_trips_title")}
        </Typography>
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
      ) : !hasResults && pageIndex === 0 ? (
        <Typography variant="body1">
          {t("communities:my_public_trips_empty_state")}
        </Typography>
      ) : (
        <>
          <TripsList>
            {trips.map((trip) => (
              <PublicTripCard key={trip.tripId} trip={trip} ownerView />
            ))}
          </TripsList>
          <PaginationRow>
            <Button
              onClick={goPrev}
              disabled={pageIndex === 0}
              startIcon={<ChevronLeft />}
            >
              {t("communities:public_trips_previous")}
            </Button>
            <Typography variant="body2">
              {t("communities:public_trips_page_indicator", {
                current: pageIndex + 1,
              })}
            </Typography>
            <Button
              onClick={goNext}
              disabled={!data?.nextPageToken}
              endIcon={<ChevronRight />}
            >
              {t("communities:public_trips_next")}
            </Button>
          </PaginationRow>
        </>
      )}
    </PageWrapper>
  );
}
