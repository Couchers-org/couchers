import { Box, Card, CardContent, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import { CalendarIcon, CouchIcon, LocationIcon } from "components/Icons";
import Pill from "components/Pill";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import StyledLink from "components/StyledLink";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useState } from "react";
import { routeToUser } from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";

import { PublicTrip } from "./useListPublicTrips";

const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  "&:last-child": {
    paddingBottom: theme.spacing(2.5),
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    gap: theme.spacing(1.5),
  },
}));

const UserSection = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(0.5),
  width: theme.spacing(14),
  minWidth: theme.spacing(14),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "row",
    width: "auto",
    minWidth: "auto",
    gap: theme.spacing(1.5),
  },
}));

const UserName = styled(Typography)({
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
});

const ContentSection = styled("div")({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
});

const MetaRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
  flexWrap: "wrap",
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
  },
}));

const MetaItem = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: "var(--mui-palette-text-secondary)",
  fontSize: "0.875rem",
  "& svg": {
    fontSize: "1rem",
  },
}));

const Description = styled(Typography)({
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

function formatDateRange(fromDate: string, toDate: string): string {
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const fromStr = from.toLocaleDateString(undefined, options);
  const toStr = to.toLocaleDateString(undefined, {
    ...options,
    year: "numeric",
  });
  return `${fromStr} – ${toStr}`;
}

function getDurationNights(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PublicTripCard({ trip }: { trip: PublicTrip }) {
  const { t } = useTranslation([COMMUNITIES]);
  const nights = getDurationNights(trip.fromDate, trip.toDate);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const { data: accountInfo } = useAccountInfo();
  const isNativeEmbed = useIsNativeEmbed();

  const handleOfferToHost = () => {
    if (!accountInfo?.profileComplete) {
      setShowIncompleteDialog(true);
    } else {
      // TODO: create host request with public_trip_id linked
    }
  };

  return (
    <>
      {showIncompleteDialog && (
        <ProfileIncompleteDialog
          open
          onClose={() => setShowIncompleteDialog(false)}
          attempted_action="send_request"
        />
      )}
      <StyledCard elevation={0}>
        <StyledCardContent>
          <UserSection>
            <Avatar user={trip.user} isProfileLink />
            <StyledLink href={routeToUser(trip.user.username)}>
              <UserName variant="h3">{trip.user.name}</UserName>
            </StyledLink>
          </UserSection>

          <ContentSection>
            <MetaRow>
              <MetaItem>
                <CalendarIcon />
                {formatDateRange(trip.fromDate, trip.toDate)}
              </MetaItem>
              <Pill variant="rounded">
                {t("communities:public_trips_nights", { count: nights })}
              </Pill>
              {trip.user.city && (
                <MetaItem>
                  <LocationIcon />
                  {trip.user.city}
                </MetaItem>
              )}
            </MetaRow>
            <Description variant="body1">{trip.description}</Description>
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <StyledLink
                href={routeToUser(trip.user.username)}
                target={isNativeEmbed ? undefined : "_blank"}
              >
                {t("communities:public_trips_view_profile")}
              </StyledLink>
              <Button startIcon={<CouchIcon />} onClick={handleOfferToHost}>
                {t("communities:public_trips_offer_to_host")}
              </Button>
            </Box>
          </ContentSection>
        </StyledCardContent>
      </StyledCard>
    </>
  );
}
