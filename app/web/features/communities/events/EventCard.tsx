import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  styled,
  Typography,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import Divider from "components/Divider";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import stripMarkdown from "utils/stripMarkdown";

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isCancelled",
})<{ isCancelled?: boolean }>(({ theme, isCancelled }) => ({
  position: "relative",
  display: "grid",
  gridTemplateRows: "1fr auto",
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
  ...(isCancelled && {
    opacity: 0.6,
    backgroundColor: theme.palette.grey[200],
  }),
}));

const Title = styled(Typography)(({ theme }) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
}));

const EventTime = styled(Typography)(({ theme }) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    WebkitLineClamp: 1,
  },
}));

const Content = styled(Typography)(({ theme }) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 5,
  overflow: "hidden",
}));

const CancelledChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: "bold",
}));

const FlagButtonWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  padding: theme.spacing(1),
  alignItems: "center",
  "& svg": {
    fontSize: 16,
  },
}));

const StyledCommentsCount = styled(Typography)(({ theme }) => ({
  alignSelf: "flex-end",
  flexShrink: 0,
  color: theme.palette.primary.main,
}));

const ActivityStatsWrapper = styled("div")({
  display: "flex",
  justifyContent: "space-between",
});

export const EVENT_CARD_TEST_ID = "event-card";
export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const { t } = useTranslation([COMMUNITIES]);

  const startTime = dayjs(timestamp2Date(event.startTime!));
  const endTime = dayjs(timestamp2Date(event.endTime!));

  const strippedContent = useMemo(
    () => stripMarkdown(event.content),
    [event.content],
  );

  const formattedEventDates = `${startTime.format("llll")} - ${endTime.format(
    endTime.isSame(startTime, "day") ? "LT" : "llll",
  )}`;

  const eventImageSrc = event.photoUrl || eventImagePlaceholderUrl;

  return (
    <StyledCard
      className={className}
      isCancelled={event.isCancelled}
      data-testid={EVENT_CARD_TEST_ID}
    >
      <Link href={routeToEvent(event.eventId, event.slug)}>
        <CardMedia
          component="div"
          sx={{
            padding: 1,
            backgroundColor: (theme) => theme.palette.grey[200],
            height: { xs: 80, sm: 100, md: 120 },
            backgroundImage: `url(${eventImageSrc})`,
            backgroundSize:
              eventImageSrc === eventImagePlaceholderUrl ? "contain" : "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {event.onlineInformation && (
            <Chip
              size="medium"
              label={t("communities:online")}
              sx={{ borderRadius: 1, fontWeight: "bold" }}
            />
          )}
        </CardMedia>
        <CardContent>
          <EventTime
            variant="body2"
            color="textSecondary"
            gutterBottom
            title={formattedEventDates}
          >
            {formattedEventDates}
          </EventTime>
          <Title variant="h3" gutterBottom>
            {event.title}
          </Title>
          <Typography
            noWrap
            variant="body2"
            gutterBottom
            sx={{
              maxWidth: "25em",
            }}
          >
            {event.offlineInformation
              ? event.offlineInformation.address
              : t("communities:virtual_event_location_placeholder")}
          </Typography>
          {event.isCancelled && (
            <CancelledChip label={t("communities:cancelled")} />
          )}
          <Divider spacing={1} />
          <div>
            <Content variant="body1" paragraph>
              {strippedContent}
            </Content>

            <ActivityStatsWrapper>
              <Typography variant="body2" color="textSecondary">
                {t("communities:attendees_count", {
                  count: event.goingCount + event.maybeCount,
                })}
              </Typography>
              <StyledCommentsCount variant="body2">
                {t("communities:comments_count", {
                  count: event.thread?.numResponses,
                })}
              </StyledCommentsCount>
            </ActivityStatsWrapper>
          </div>
        </CardContent>
      </Link>
      <FlagButtonWrapper>
        <FlagButton
          contentRef={`event/${event.eventId}`}
          authorUser={event.creatorUserId}
        />
      </FlagButtonWrapper>
    </StyledCard>
  );
}
