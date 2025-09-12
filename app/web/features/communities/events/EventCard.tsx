import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  Typography,
  styled,
} from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";

import { EVENT_IMAGE_PLACEHOLDER_URL } from "@/appConstants";
import Divider from "@/components/Divider";
import FlagButton from "@/features/FlagButton";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { Event } from "@/proto/events_pb";
import { routeToEvent } from "@/routes";
import { theme } from "@/theme";
import { timestamp2Date } from "@/utils/date";
import dayjs from "@/utils/dayjs";
import stripMarkdown from "@/utils/stripMarkdown";

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isCancelled",
})<{ isCancelled?: boolean }>(({ theme, isCancelled }) => ({
  position: "relative",
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
  ...(isCancelled && {
    opacity: 0.6,
    backgroundColor: theme.palette.grey[200],
  }),
}));

const Title = styled(Typography)(() => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
}));

const EventTime = styled(Typography)(() => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    WebkitLineClamp: 1,
  },
}));

const Content = styled("p")(() => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 5,
  overflow: "hidden",
}));

const CancelledChip = styled(Chip)(() => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: "bold",
}));

const FlagButtonWrapper = styled("div")({
  position: "absolute",
  bottom: 8,
  right: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  "& svg": {
    fontSize: 16,
  },
});

export const EVENT_CARD_TEST_ID = "event-card";
export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

const EventCard = ({ event, className }: EventCardProps) => {
  const { t } = useTranslation([COMMUNITIES]);

  const strippedContent = useMemo(
    () => stripMarkdown(event.content),
    [event.content],
  );

  if (!event.startTime || !event.endTime) {
    return <></>;
  }

  const startTime = dayjs(timestamp2Date(event.startTime));
  const endTime = dayjs(timestamp2Date(event.endTime));

  const formattedEventDates = `${startTime.format("llll")} - ${endTime.format(
    endTime.isSame(startTime, "day") ? "LT" : "llll",
  )}`;

  const eventImageSrc = event.photoUrl || EVENT_IMAGE_PLACEHOLDER_URL;

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
              eventImageSrc === EVENT_IMAGE_PLACEHOLDER_URL
                ? "contain"
                : "cover",
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

          <Typography noWrap variant="body2" gutterBottom>
            {event.offlineInformation
              ? event.offlineInformation.address
              : t("communities:virtual_event_location_placeholder")}
          </Typography>

          {event.isCancelled && (
            <CancelledChip label={t("communities:cancelled")} />
          )}

          <Divider spacing={1} />

          <div>
            <Typography variant="body1" component={Content}>
              {strippedContent}
            </Typography>

            <Typography variant="body2" color="textSecondary">
              {t("communities:attendees_count", {
                count: event.goingCount + event.maybeCount,
              })}
            </Typography>
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
};

export default EventCard;
