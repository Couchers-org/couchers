import {
  EventOutlined,
  HourglassEmptyOutlined,
  PlaceOutlined,
  VisibilityOutlined,
  WavingHandOutlined,
} from "@mui/icons-material";
import { alpha, Box, Skeleton, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import { useCommunity } from "features/communities/hooks";
import { PublicTrip } from "features/publicTrips/useListPublicTrips";
import { useTranslation } from "i18n";
import { DASHBOARD, PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { myPublicTripsRoute, routeToCommunity } from "routes";
import { Temporal } from "temporal-polyfill";
import { localizeDateTimeRange, localizeRelativeTimeUnit } from "utils/date";
import dayjs from "utils/dayjs";

export const CARD_WIDTH = 220;
export const CARD_GAP = 12;

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

const PinTile = styled("div")(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: "10px",
  background: alpha(theme.palette.primary.main, 0.1),
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}));

const IdentityRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

const TextBlock = styled("div")({
  minWidth: 0,
  flex: 1,
});

const DescriptionText = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: "var(--mui-palette-text-secondary)",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  textOverflow: "ellipsis",
  lineHeight: 1.4,
  marginTop: theme.spacing(0.75),
  [theme.breakpoints.down("sm")]: {
    WebkitLineClamp: 1,
  },
}));

const WhenChipStyled = styled("span")(({ theme }) => ({
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 999,
  padding: "2px 8px",
  whiteSpace: "nowrap",
  flexShrink: 0,
  marginLeft: "auto",
  background: alpha(theme.palette.secondary.main, 0.12),
  color: "var(--mui-palette-secondary-dark)",
}));

const MetaRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: "1px dashed var(--mui-palette-divider)",
}));

function WhenChip({
  fromDate,
  toDate,
  locale,
}: {
  fromDate: string;
  toDate: string;
  locale: string;
}) {
  const { t } = useTranslation([DASHBOARD]);
  const todayStart = dayjs().startOf("day");
  const fromStart = dayjs(fromDate).startOf("day");
  const toStart = dayjs(toDate).startOf("day");

  const isOngoing =
    fromStart.isBefore(todayStart) && !toStart.isBefore(todayStart);
  const daysUntil = fromStart.diff(todayStart, "day");

  let label: string | null = null;
  if (isOngoing) {
    label = t("dashboard:public_trips.when_now");
  } else if (daysUntil === 0 || daysUntil === 1) {
    label = localizeRelativeTimeUnit(daysUntil, "days", locale);
  }

  if (!label) return null;
  return <WhenChipStyled>{label}</WhenChipStyled>;
}

function GenderChip() {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: "var(--mui-palette-text-secondary)",
        flexShrink: 0,
        marginLeft: "auto",
      }}
    >
      <VisibilityOutlined sx={{ fontSize: "13px", display: "block" }} />
      {t("dashboard:public_trips.same_gender_only_indicator")}
    </Box>
  );
}

function OffersChip({ count }: { count: number }) {
  const { t } = useTranslation([DASHBOARD]);
  const hasOffers = count > 0;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: hasOffers
          ? "var(--mui-palette-primary-dark)"
          : "var(--mui-palette-text-secondary)",
        flexShrink: 0,
      }}
    >
      {hasOffers ? (
        <WavingHandOutlined sx={{ fontSize: "15px" }} />
      ) : (
        <HourglassEmptyOutlined sx={{ fontSize: "15px" }} />
      )}
      {hasOffers
        ? t("dashboard:public_trips.offers_count", { count })
        : t("dashboard:public_trips.no_offers")}
    </Box>
  );
}

export function DashboardPublicTripCard({
  trip,
  locale,
  offersCount,
  isOwnTrip,
}: {
  trip: PublicTrip;
  locale: string;
  offersCount?: number;
  isOwnTrip?: boolean;
}) {
  const { t } = useTranslation([DASHBOARD, PUBLIC_TRIPS]);
  // When isOwnTrip is provided (even false), render in community-overview mode:
  // avatar instead of pin tile, user name instead of community name, no MetaRow.
  const communityMode = isOwnTrip !== undefined;

  const { data: community, isLoading: communityLoading } = useCommunity(
    communityMode ? 0 : trip.communityId,
  );

  const dateRange = localizeDateTimeRange(
    Temporal.PlainDateTime.from(trip.fromDate),
    Temporal.PlainDateTime.from(trip.toDate),
    { locale, includeTime: false, abbreviate: true },
  );

  const hasFooter =
    !communityMode && (offersCount !== undefined || trip.sameGenderOnly);

  const href = communityMode
    ? `${routeToCommunity(trip.communityId, trip.communitySlug, "public-trips")}#trip-${trip.tripId}`
    : `${myPublicTripsRoute}#public-trip-${trip.tripId}`;

  const { user } = trip;
  if (communityMode && !user) return null;

  return (
    <Link
      href={href}
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
          {communityMode ? (
            <Box
              sx={{
                position: "relative",
                width: "3rem",
                height: "3rem",
                flexShrink: 0,
              }}
            >
              <Avatar user={user!} isProfileLink={false} />
              {isOwnTrip && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    bgcolor: "rgba(0,0,0,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {t("publicTrips:you_overlay")}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <PinTile>
              <PlaceOutlined
                sx={{ fontSize: 22, color: "var(--mui-palette-primary-main)" }}
              />
            </PinTile>
          )}
          <TextBlock>
            <Typography
              variant="h3"
              noWrap
              sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}
            >
              {communityMode ? (
                user!.name
              ) : communityLoading ? (
                <Skeleton width={80} />
              ) : (
                (community?.name ?? "—")
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                color: "var(--mui-palette-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                mt: "2px",
                overflow: "hidden",
              }}
            >
              <EventOutlined style={{ fontSize: 12, flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {dateRange}
              </span>
            </Typography>
          </TextBlock>
          <WhenChip
            fromDate={trip.fromDate}
            toDate={trip.toDate}
            locale={locale}
          />
        </IdentityRow>
        <DescriptionText variant="body2">{trip.description}</DescriptionText>
        {hasFooter && (
          <MetaRow>
            {offersCount !== undefined && <OffersChip count={offersCount} />}
            {trip.sameGenderOnly && <GenderChip />}
          </MetaRow>
        )}
      </StyledCard>
    </Link>
  );
}

export function DashboardPublicTripCardSkeleton() {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: "10px",
        background: "var(--mui-palette-background-paper)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
        <Skeleton
          variant="rectangular"
          width={40}
          height={40}
          sx={{ borderRadius: "10px", flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton height={16} sx={{ mb: 0.5 }} />
          <Skeleton height={12} width="70%" />
        </Box>
      </Box>
      <Skeleton height={12} sx={{ mt: 1 }} />
      <Skeleton height={12} width="80%" />
    </Box>
  );
}
