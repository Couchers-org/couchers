import { Group } from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardMedia,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import Pill from "components/Pill";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { routeToEvent } from "routes";
import {
  BROWSER_TIMEZONE,
  localizeDateTimeRange,
  timestamp2Date,
} from "utils/date";
import dayjs from "utils/dayjs";

const StyledCard = styled(Card)(({ theme }) => ({
  margin: 0,
  "&:not(:first-of-type)": {
    margin: theme.spacing(2, 0),
  },
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-50)",
  },
}));

const StyledLink = styled(Link)(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: theme.spacing(20),
  textDecoration: "none",
  color: "inherit",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    height: "auto",
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  width: "75%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

const Row = styled("div")({
  display: "flex",
  justifyContent: "space-between",
});

const Title = styled(Typography)(({ theme }) => ({
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxHeight: "3em",
  lineHeight: "1.5em",
  paddingRight: theme.spacing(2),
}));

const Tags = styled("div")(({ theme }) => ({
  minWidth: theme.spacing(15),
  [theme.breakpoints.down("sm")]: {
    minWidth: theme.spacing(10),
  },
}));

const EventInfo = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  flexDirection: "column",
  fontSize: ".85rem",
}));

const ActivityStatsWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: ".2em",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  fontSize: ".85rem",
  marginRight: theme.spacing(1),
}));

const Attendees = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  minWidth: theme.spacing(10),
  color: "var(--mui-palette-text-secondary)",
}));

const StyledCommentsCount = styled(Typography)(({ theme }) => ({
  color: "var(--mui-palette-primary-main)",
}));

const FlagWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  cursor: "pointer",
  marginLeft: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "& svg": {
    fontSize: 16,
  },
}));

const CancelledPill = styled(Pill)(({ theme }) => ({
  backgroundColor: "var(--mui-palette-error-main)",
  color: "var(--mui-palette-common-white)",
}));

const LongEventCard = ({
  event,
  userId,
}: {
  event: Event.AsObject;
  userId?: number | null | undefined;
}) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([COMMUNITIES]);

  const dateTimeRangeText = localizeDateTimeRange(
    dayjs(timestamp2Date(event.startTime!)),
    dayjs(timestamp2Date(event.endTime!)),
    {
      // TODO(#8064): Should use the event.timezone, but it's currently incorrect.
      timezone: BROWSER_TIMEZONE,
      locale,
      includeDayOfWeek: true,
      includeTime: true,
      capitalize: true,
    },
  );

  const isCreatedByMe = event.creatorUserId === userId;
  const isOnline = event.onlineInformation?.link !== undefined;
  const isCancelled = event.isCancelled;

  return (
    <StyledCard data-testid="event-item">
      <StyledLink href={routeToEvent(event.eventId, event.slug)}>
        <CardMedia
          component="img"
          image={event.photoUrl || eventImagePlaceholderUrl}
          title={event.title}
          sx={{
            objectFit: event.photoUrl ? "cover" : "contain",
            height: { xs: 100, sm: "100%" },
            width: { xs: "100%", sm: "25%" },
          }}
        />
        <FlagWrapper>
          <FlagButton
            contentRef={`event/${event.eventId}`}
            authorUser={event.creatorUserId}
          />
        </FlagWrapper>

        <StyledCardContent>
          <Row>
            <Tooltip title={event.title}>
              <Title variant="h3">{event.title}</Title>
            </Tooltip>
            <Tags>
              {isCreatedByMe && (
                <Pill variant="rounded">{t("communities:created_by_me")}</Pill>
              )}
              {isOnline && (
                <Pill variant="rounded">{t("communities:online")}</Pill>
              )}
              {isCancelled && (
                <CancelledPill variant="rounded">
                  {t("communities:cancelled")}
                </CancelledPill>
              )}
            </Tags>
          </Row>

          <Row>
            <EventInfo>
              {event.offlineInformation
                ? event.offlineInformation.address
                : t("communities:virtual_event_location_placeholder")}
              <div>{dateTimeRangeText}</div>
            </EventInfo>
            <ActivityStatsWrapper>
              <Attendees>
                <Group fontSize="small" sx={{ marginRight: "0.25rem" }} />
                {event.goingCount}
              </Attendees>
              <StyledCommentsCount variant="body2">
                {t("communities:comments_count", {
                  count: event.thread?.numResponses,
                })}
              </StyledCommentsCount>
            </ActivityStatsWrapper>
          </Row>
        </StyledCardContent>
      </StyledLink>
    </StyledCard>
  );
};

export default LongEventCard;
