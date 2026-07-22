import {
  HourglassEmptyOutlined,
  PlaceOutlined,
  WavingHandOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CouchIcon,
  EditIcon,
  ExpandLessIcon,
  ExpandMoreIcon,
  ReopenIcon,
  VisibilityIcon,
} from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { PublicTripStatus } from "proto/public_trips_pb";
import { useCallback, useState } from "react";
import { routeToCommunity, routeToHostRequest, routeToUser } from "routes";
import { Temporal } from "temporal-polyfill";
import { localizeDateTimeRange } from "utils/date";
import dayjs from "utils/dayjs";
import { useIsNativeEmbed } from "utils/nativeLink";

import OfferToHostDialog from "./OfferToHostDialog";
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
    paddingRight: theme.spacing(5),
  },
}));

const UserName = styled(Typography)({
  maxWidth: "100%",
  textAlign: "left",
  overflowWrap: "break-word",
});

const UserDetails = styled(Typography)({
  color: "var(--mui-palette-text-secondary)",
  textAlign: "left",
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
})<{ expanded: boolean }>(({ expanded, theme }) => ({
  ...(!expanded && {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    [theme.breakpoints.down("sm")]: {
      WebkitLineClamp: 2,
    },
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
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );
  const { data: accountInfo } = useAccountInfo();
  const { authState } = useAuthContext();
  const isNativeEmbed = useIsNativeEmbed();
  const { mutate: updateTrip } = useUpdatePublicTrip();
  const isOwnTrip = trip.user?.userId === authState.userId;

  // The backend sets viewerHostRequestId to the viewer's own existing offer on
  // this trip (0 if none), scoped per-trip so it's correct at any scale.
  const alreadyOffered = trip.viewerHostRequestId > 0;

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
      setShowOfferDialog(true);
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
      {!ownerView && user && (
        <OfferToHostDialog
          open={showOfferDialog}
          onClose={() => setShowOfferDialog(false)}
          tripId={trip.tripId}
          hostUserId={user.userId}
          hostName={user.name}
          tripFromDate={Temporal.PlainDate.from(trip.fromDate)}
          tripToDate={Temporal.PlainDate.from(trip.toDate)}
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
                ...(isClosed && !isPast
                  ? [
                      {
                        icon: ReopenIcon,
                        label: t("publicTrips:reopen"),
                        onClick: () =>
                          updateTrip({
                            tripId: trip.tripId,
                            status:
                              PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
                          }),
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
                  Temporal.PlainDateTime.from(trip.fromDate),
                  Temporal.PlainDateTime.from(trip.toDate),
                  {
                    locale,
                    includeTime: false,
                    abbreviate: true,
                  },
                )}
              </MetaItem>
              {trip.communityName && (
                <MetaItem>
                  <PlaceOutlined sx={{ fontSize: "1rem" }} />
                  <StyledLink
                    href={routeToCommunity(
                      trip.communityId,
                      trip.communitySlug,
                    )}
                  >
                    {trip.communityName}
                  </StyledLink>
                </MetaItem>
              )}
              {trip.sameGenderOnly && (
                <MetaItem>
                  <VisibilityIcon />
                  {t("publicTrips:same_gender_only_indicator")}
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isClosed ? (
                      <Chip
                        label={t("publicTrips:status_closed")}
                        size="small"
                      />
                    ) : isPast ? (
                      <Chip label={t("publicTrips:status_past")} size="small" />
                    ) : (
                      <Chip
                        label={t("publicTrips:status_active")}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {trip.offersCount !== undefined && (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color:
                            trip.offersCount > 0
                              ? "var(--mui-palette-primary-main)"
                              : "var(--mui-palette-text-secondary)",
                        }}
                      >
                        {trip.offersCount > 0 ? (
                          <WavingHandOutlined sx={{ fontSize: "1rem" }} />
                        ) : (
                          <HourglassEmptyOutlined sx={{ fontSize: "1rem" }} />
                        )}
                        {trip.offersCount > 0
                          ? t("publicTrips:invitations_count", {
                              count: trip.offersCount,
                            })
                          : t("publicTrips:no_invitations")}
                      </Box>
                    )}
                  </Box>
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
                      {alreadyOffered ? (
                        // Link to the existing offer thread.
                        <Button
                          component={Link}
                          href={routeToHostRequest(trip.viewerHostRequestId)}
                          endIcon={<ChevronRightIcon />}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {t("publicTrips:already_offered")}
                        </Button>
                      ) : isDimmed ? (
                        // Closed/past trips can't be offered on (the backend
                        // rejects it). These shouldn't normally reach this list,
                        // but guard against the trip closing/expiring while the
                        // card is on screen. Tooltip needs a wrapper since
                        // disabled buttons don't emit hover events.
                        <Tooltip title={t("publicTrips:offer_unavailable")}>
                          <span>
                            <Button startIcon={<CouchIcon />} disabled>
                              {t("publicTrips:offer_to_host")}
                            </Button>
                          </span>
                        </Tooltip>
                      ) : (
                        <Button
                          startIcon={<CouchIcon />}
                          onClick={handleOfferToHost}
                        >
                          {t("publicTrips:offer_to_host")}
                        </Button>
                      )}
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
