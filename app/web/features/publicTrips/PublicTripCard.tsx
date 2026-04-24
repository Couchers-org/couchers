import {
  Box,
  Card,
  CardContent,
  Chip,
  styled,
  Typography,
} from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import {
  CalendarIcon,
  CheckCircleIcon,
  CouchIcon,
  EditIcon,
  ExpandLessIcon,
  ExpandMoreIcon,
  HomeIcon,
} from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import { PublicTripStatus } from "proto/public_trips_pb";
import { useCallback, useState } from "react";
import { routeToUser } from "routes";
import { localizeDateTimeRange } from "utils/date";
import dayjs from "utils/dayjs";
import { useIsNativeEmbed } from "utils/nativeLink";

import PublicTripDialog from "./PublicTripDialog";
import { PublicTrip, useUpdatePublicTrip } from "./useListPublicTrips";

interface PublicTripCardProps {
  trip: PublicTrip;
  // When true, renders the owner's view: hides Offer-to-host / View profile /
  // Flag, shows Edit / Close actions and a status chip for closed trips.
  ownerView?: boolean;
  id?: string;
}

const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
  position: "relative",
}));

const OwnerMenuContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  zIndex: 1,
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

export default function PublicTripCard({
  trip,
  ownerView = false,
  id,
}: PublicTripCardProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([PUBLIC_TRIPS]);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      setIsOverflowing(node.scrollHeight > node.clientHeight);
    }
  }, []);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );
  const { data: accountInfo } = useAccountInfo();
  const { authState } = useAuthContext();
  const isNativeEmbed = useIsNativeEmbed();
  const { mutate: updateTrip } = useUpdatePublicTrip();
  const isOwnTrip = trip.user?.userId === authState.userId;

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

  const isClosed = trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED;
  const isPast = dayjs(trip.toDate).isBefore(dayjs().startOf("day"));
  const isDimmed = isClosed || isPast;
  const showOwnMarker = isOwnTrip && !ownerView;

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
      {ownerView && (
        <PublicTripDialog
          mode="edit"
          trip={trip}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
        />
      )}
      <StyledCard id={id} elevation={0} sx={{ opacity: isDimmed ? 0.65 : 1 }}>
        {ownerView && (
          <ConfirmationDialogWrapper
            title={t("publicTrips:close_dialog_title")}
            message={t("publicTrips:close_dialog_message")}
            confirmButtonLabel={t("publicTrips:close_dialog_confirm")}
            onConfirm={() =>
              updateTrip({
                tripId: trip.tripId,
                status: PublicTripStatus.PUBLIC_TRIP_STATUS_CLOSED,
              })
            }
          >
            {(setConfirmOpen) => {
              const menuItems: EllipsisMenuItem[] = [
                {
                  icon: EditIcon,
                  label: t("publicTrips:edit"),
                  onClick: () => setShowEditDialog(true),
                },
                ...(!isClosed
                  ? [
                      {
                        icon: CheckCircleIcon,
                        label: t("publicTrips:close"),
                        onClick: () => setConfirmOpen(true),
                      },
                    ]
                  : []),
              ];
              return (
                <OwnerMenuContainer>
                  <EllipsisMenu
                    idName={`public-trip-${trip.tripId}`}
                    isMenuOpen={!!menuAnchorEl}
                    menuAnchorEl={menuAnchorEl}
                    onMenuOpen={handleMenuOpen}
                    onMenuClose={handleMenuClose}
                    items={menuItems}
                  />
                </OwnerMenuContainer>
              );
            }}
          </ConfirmationDialogWrapper>
        )}
        <StyledCardContent>
          <UserSection>
            <Box
              sx={{
                position: "relative",
                width: "3rem",
                height: "3rem",
                flexShrink: 0,
              }}
            >
              <Avatar user={user} isProfileLink />
              {showOwnMarker && (
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
            <StyledLink href={routeToUser(user.username)}>
              <UserName variant="h3">{user.name}</UserName>
            </StyledLink>
            <UserDetails variant="body2">
              {user.age}
              {user.gender ? `, ${user.gender}` : ""}
            </UserDetails>
            <UserDetails variant="body2">
              {t("publicTrips:references", {
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
                  ? t("publicTrips:show_less")
                  : t("publicTrips:show_more")}
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Typography>
            )}
            {!showOwnMarker && (
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                {ownerView ? (
                  isClosed ? (
                    <Chip label={t("publicTrips:status_closed")} size="small" />
                  ) : isPast ? (
                    <Chip label={t("publicTrips:status_past")} size="small" />
                  ) : (
                    <Chip
                      label={t("publicTrips:status_active")}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )
                ) : (
                  <>
                    <StyledLink
                      href={routeToUser(user.username)}
                      target={isNativeEmbed ? undefined : "_blank"}
                    >
                      {t("publicTrips:view_profile")}
                    </StyledLink>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FlagButton
                        contentRef={`public_trip/${trip.tripId}`}
                        authorUser={user.userId}
                      />
                      <Button
                        startIcon={<CouchIcon />}
                        onClick={handleOfferToHost}
                      >
                        {t("publicTrips:offer_to_host")}
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </ContentSection>
        </StyledCardContent>
      </StyledCard>
    </>
  );
}
