import {
  Card,
  CardContent,
  CardMedia,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import { AttendeesIcon, CalendarIcon } from "components/Icons";
import Pill from "components/Pill";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";

import getContentSummary from "../getContentSummary";

const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(2),
  },
  "&:hover": {
    backgroundColor: theme.palette.grey[50],
  },
}));

const StyledCardContainer = styled(Link)(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: theme.spacing(20),
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    height: "auto",
  },
}));

const StyledCardMedia = styled(CardMedia)<{ component?: React.ElementType }>(
  ({ theme }) => ({
    height: "100%",
    width: "25%",
    objectFit: "fill",
  }),
);

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  width: "75%",
  display: "flex",
  padding: "0 !important",
  flexDirection: "column",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    "& .MuiTypography-root": {
      fontSize: "0.75rem",
    },
    "& .MuiTypography-h2": {
      fontSize: "1rem",
    },
  },
}));

const StyledRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
}));

const StyledLocationText = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.grey[600],
}));

const StyledIcon = styled("span")(({ theme }) => ({
  display: "block",
  fontSize: "1.25rem",
  lineHeight: 1.5,
  marginInlineEnd: theme.spacing(0.5),
}));

const StyledEventTimeContainer = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
}));

const StyledAttendeesCountContainer = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
}));

const StyledTags = styled("div")(({ theme }) => ({
  minWidth: theme.spacing(15),
  [theme.breakpoints.down("sm")]: {
    "& > *": {
      fontSize: "0.5rem",
    },
  },
}));

const LongEventCard = ({
  event,
  userId,
}: {
  event: Event.AsObject;
  userId?: number | null | undefined;
}) => {
  const { t } = useTranslation([COMMUNITIES]);
  const isBelowLg = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: event.content,
        maxLength: isBelowLg ? 120 : 300,
      }),
    [event.content, isBelowLg],
  );
  const startTime = dayjs(timestamp2Date(event.startTime!)).format("llll");
  const isCreatedByMe = event.creatorUserId === userId;
  const isOnline = event.onlineInformation?.link !== undefined;
  const isCancelled = event.isCancelled;

  return (
    <StyledCard data-testid="event-item">
      <StyledCardContainer href={routeToEvent(event.eventId, event.slug)}>
        <StyledCardMedia
          component="img"
          image={event.photoUrl || eventImagePlaceholderUrl}
        />
        <StyledCardContent>
          <StyledRow>
            <div>
              <Typography variant="h2">{event.title}</Typography>
              <StyledLocationText variant="body1">
                {event.offlineInformation
                  ? event.offlineInformation.address
                  : t("communities:virtual_event_location_placeholder")}
              </StyledLocationText>
            </div>
            <StyledTags>
              {isCreatedByMe && (
                <Pill variant="rounded">{t("communities:created_by_me")}</Pill>
              )}
              {isOnline && (
                <Pill variant="rounded">{t("communities:online")}</Pill>
              )}
              {isCancelled && (
                <Pill
                  backgroundColor={theme.palette.error.main}
                  color={theme.palette.common.white}
                  variant="rounded"
                >
                  {t("communities:cancelled")}
                </Pill>
              )}
            </StyledTags>
          </StyledRow>
          <div>
            <StyledEventTimeContainer>
              <StyledIcon>
                <CalendarIcon />
              </StyledIcon>
              <Typography variant="body1">{startTime}</Typography>
            </StyledEventTimeContainer>
            <StyledAttendeesCountContainer>
              <StyledIcon>
                <AttendeesIcon />
              </StyledIcon>
              <Typography variant="body1">
                {t("communities:attendees_count", {
                  count: event.goingCount + event.maybeCount,
                })}
              </Typography>
            </StyledAttendeesCountContainer>
          </div>
          {!isMobile && (
            <Typography variant="body1">{truncatedContent}</Typography>
          )}
        </StyledCardContent>
      </StyledCardContainer>
    </StyledCard>
  );
};

export default LongEventCard;
