import { Box, Card, CardActionArea, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import { CalendarIcon, VisibilityIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { routeToCommunity } from "routes";
import { localizeDateTimeRange } from "utils/date";

import { PublicTrip } from "./useListPublicTrips";

const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
}));

const Content = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
}));

const Info = styled("div")({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: 1,
});

const DateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: "var(--mui-palette-text-secondary)",
  fontSize: "0.8125rem",
  "& svg": { fontSize: "0.9rem" },
}));

const Description = styled(Typography)({
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

interface Props {
  trip: PublicTrip;
  communityId: number;
  communitySlug: string;
  className?: string;
}

export default function CompactPublicTripCard({
  trip,
  communityId,
  communitySlug,
  className,
}: Props) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([PUBLIC_TRIPS]);
  const { authState } = useAuthContext();

  const { user } = trip;
  if (!user) return null;

  const isOwnTrip = user.userId === authState.userId;

  const href = `${routeToCommunity(communityId, communitySlug, "public-trips")}#trip-${trip.tripId}`;

  return (
    <StyledCard elevation={0} className={className}>
      <CardActionArea LinkComponent={Link} href={href}>
        <Content>
          <Box
            sx={{
              position: "relative",
              width: "3rem",
              height: "3rem",
              flexShrink: 0,
            }}
          >
            <Avatar user={user} isProfileLink={false} />
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
          <Info>
            <Typography variant="h3" noWrap>
              {user.name}
            </Typography>
            <DateRow>
              <CalendarIcon />
              {localizeDateTimeRange(
                new Date(trip.fromDate + "T00:00:00"),
                new Date(trip.toDate + "T00:00:00"),
                { locale, includeTime: false, abbreviate: true },
              )}
            </DateRow>
            {trip.sameGenderOnly && (
              <DateRow>
                <VisibilityIcon />
                {t("publicTrips:same_gender_only_indicator")}
              </DateRow>
            )}
            <Description variant="body2" color="textSecondary">
              {trip.description}
            </Description>
          </Info>
        </Content>
      </CardActionArea>
    </StyledCard>
  );
}
