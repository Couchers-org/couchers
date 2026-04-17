import { Box, Card, CardContent, styled, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import {
  CalendarIcon,
  CouchIcon,
  ExpandLessIcon,
  ExpandMoreIcon,
  HomeIcon,
} from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import StyledLink from "components/StyledLink";
import useAccountInfo from "features/auth/useAccountInfo";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useCallback, useState } from "react";
import { routeToUser } from "routes";
import { localizeDateTimeRange } from "utils/date";
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
  textAlign: "center",
  overflowWrap: "break-word",
});

const UserDetails = styled(Typography)({
  color: "var(--mui-palette-text-secondary)",
  textAlign: "center",
  maxWidth: "100%",
  overflowWrap: "break-word",
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

const Description = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded: boolean }>(({ expanded }) => ({
  ...(!expanded && {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
}));

export default function PublicTripCard({ trip }: { trip: PublicTrip }) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([COMMUNITIES]);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      setIsOverflowing(node.scrollHeight > node.clientHeight);
    }
  }, []);
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

  // The backend always populates user, but the proto type is optional.
  const { user } = trip;
  if (!user) return null;

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
            <Avatar user={user} isProfileLink />
            <StyledLink href={routeToUser(user.username)}>
              <UserName variant="h3">{user.name}</UserName>
            </StyledLink>
            <UserDetails variant="body2">
              {user.age}
              {user.gender ? `, ${user.gender}` : ""}
            </UserDetails>
            <UserDetails variant="body2">
              {t("communities:public_trips_references", {
                count: user.numReferences,
              })}
            </UserDetails>
          </UserSection>

          <ContentSection>
            <MetaRow>
              <MetaItem>
                <CalendarIcon />
                {localizeDateTimeRange(
                  new Date(trip.fromDate + "T00:00:00"),
                  new Date(trip.toDate + "T00:00:00"),
                  {
                    locale,
                    includeTime: false,
                    abbreviate: true,
                  },
                )}
              </MetaItem>
              {user.city && (
                <MetaItem>
                  <HomeIcon />
                  {user.city}
                </MetaItem>
              )}
            </MetaRow>
            <Description
              variant="body1"
              ref={descriptionRef}
              expanded={expanded}
              onClick={
                isOverflowing || expanded
                  ? () => setExpanded((e) => !e)
                  : undefined
              }
              sx={{ cursor: isOverflowing || expanded ? "pointer" : "default" }}
            >
              {trip.description}
            </Description>
            {(isOverflowing || expanded) && (
              <Typography
                variant="body2"
                onClick={() => setExpanded((e) => !e)}
                sx={{
                  cursor: "pointer",
                  color: "var(--mui-palette-primary-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                  mt: 0.5,
                }}
              >
                {expanded
                  ? t("communities:public_trips_show_less")
                  : t("communities:public_trips_show_more")}
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Typography>
            )}
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <StyledLink
                href={routeToUser(user.username)}
                target={isNativeEmbed ? undefined : "_blank"}
              >
                {t("communities:public_trips_view_profile")}
              </StyledLink>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FlagButton
                  contentRef={`public_trip/${trip.tripId}`}
                  authorUser={user.userId}
                />
                <Button startIcon={<CouchIcon />} onClick={handleOfferToHost}>
                  {t("communities:public_trips_offer_to_host")}
                </Button>
              </Box>
            </Box>
          </ContentSection>
        </StyledCardContent>
      </StyledCard>
    </>
  );
}
