import { Group } from "@mui/icons-material";
import { Card, CardContent, CardMedia, Chip, styled, Typography } from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import Divider from "components/Divider";
import FlagButton from "features/FlagButton";
import { useTranslation } from "i18n";
import { localizeDateTimeRange } from "i18n/datetimes";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { timestampToPlainDateTime } from "utils/date";
import stripMarkdown from "utils/stripMarkdown";

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isCancelled",
})<{ isCancelled?: boolean }>(({ theme, isCancelled }) => ({
  position: "relative",
  display: "grid",
  gridTemplateRows: "1fr auto",
  overflow: "hidden",
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-50)",
  },
  ...(isCancelled && {
    opacity: 0.6,
    backgroundColor: "var(--mui-palette-grey-200)",
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

const Content = styled(Typography)({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  wordBreak: "break-word",
  maxHeight: "4.5em",
});

const CancelledChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: "bold",
}));

const FlagButtonWrapper = styled("div")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(1),
  "& svg": {
    fontSize: 16,
  },
}));

const StyledCommentsCount = styled(Typography)(({ theme }) => ({
  alignSelf: "flex-end",
  flexShrink: 0,
  color: theme.palette.primary.main,
}));

const ContentWrapper = styled("div")({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
});

const ActivityStatsWrapper = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  marginTop: "auto",
});

const StyledLink = styled(Link)({
  textDecoration: "none",
  color: "inherit",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
});

const StyledCardContent = styled(CardContent)({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  height: 240,
  overflow: "hidden",
  "&:last-child": {
    paddingBottom: 16, // Override MUI's default last-child padding
  },
});

export const EVENT_CARD_TEST_ID = "event-card";
interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([COMMUNITIES]);

  const dateTimeRangeText = localizeDateTimeRange(
    timestampToPlainDateTime(event.startTime!, event.timezone),
    timestampToPlainDateTime(event.endTime!, event.timezone),
    {
      locale,
      includeYear: "auto",
      includeDayOfWeek: true,
      abbreviate: true,
      capitalize: true,
    },
  );

  const strippedContent = useMemo(() => stripMarkdown(event.content), [event.content]);

  const eventImageSrc = event.photoUrl || eventImagePlaceholderUrl;

  return (
    <StyledCard className={className} isCancelled={event.isCancelled} data-testid={EVENT_CARD_TEST_ID}>
      <StyledLink href={routeToEvent(event.eventId, event.slug)}>
        <CardMedia
          component="div"
          sx={{
            position: "relative",
            padding: 1,
            backgroundColor: "var(--mui-palette-grey-200)",
            height: { xs: 80, sm: 100, md: 120 },
            backgroundImage: `url(${eventImageSrc})`,
            backgroundSize: eventImageSrc === eventImagePlaceholderUrl ? "contain" : "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <FlagButtonWrapper>
            <FlagButton contentRef={`event/${event.eventId}`} authorUser={event.creatorUserId} />
          </FlagButtonWrapper>
        </CardMedia>
        <StyledCardContent>
          <EventTime variant="body2" color="textSecondary" gutterBottom title={dateTimeRangeText}>
            {dateTimeRangeText}
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
            {event.location?.address}
          </Typography>
          {event.isCancelled && <CancelledChip label={t("communities:cancelled")} />}
          <Divider spacing={1} />
          <ContentWrapper>
            <Content>{strippedContent}</Content>

            <ActivityStatsWrapper>
              <Typography variant="body2" color="textSecondary" sx={{ display: "flex", alignItems: "center" }}>
                <Group fontSize="small" sx={{ marginRight: "0.25rem" }} />
                {event.goingCount}
              </Typography>
              <StyledCommentsCount variant="body2">
                {t("communities:comments_count", {
                  count: event.thread?.numResponses,
                })}
              </StyledCommentsCount>
            </ActivityStatsWrapper>
          </ContentWrapper>
        </StyledCardContent>
      </StyledLink>
    </StyledCard>
  );
}
