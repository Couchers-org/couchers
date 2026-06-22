import { ChevronRight, Group, Place, Schedule } from "@mui/icons-material";
import { Skeleton, styled } from "@mui/material";
import { useTranslation } from "i18n";
import {
  BROWSER_TIMEZONE,
  localizeDateTime,
  localizeMonthAbbreviation,
} from "i18n/dates";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";

export const EventListContainer = styled("div")({
  border: "1px solid var(--mui-palette-grey-300)",
  borderRadius: "8px",
  overflow: "hidden",
});

const RowLink = styled(Link)({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "10px 14px",
  textDecoration: "none",
  color: "inherit",
  borderBottom: "1px solid var(--mui-palette-divider)",
  "&:last-child": {
    borderBottom: "none",
  },
  "&:hover": {
    backgroundColor: "var(--mui-palette-grey-50)",
  },
});

const DateChip = styled("div")({
  width: 40,
  flexShrink: 0,
  border: "1px solid var(--mui-palette-grey-300)",
  borderRadius: "5px",
  padding: "4px 0",
  textAlign: "center",
  backgroundColor: "var(--mui-palette-background-paper)",
  "&[data-today]": {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    overflow: "hidden",
  },
});

const DateMonth = styled("div")<{ $labelFontSize?: number }>(
  ({ $labelFontSize }) => ({
    fontSize: $labelFontSize ? `${$labelFontSize}px` : "9px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--mui-palette-secondary-main)",
    fontWeight: 700,
    lineHeight: 1.2,
    "[data-today] &": {
      color: "var(--mui-palette-primary-main)",
    },
  }),
);

const DateDay = styled("div")({
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: 1,
  marginTop: "2px",
  color: "var(--mui-palette-text-primary)",
});

const ContentWrapper = styled("div")({
  flex: 1,
  minWidth: 0,
});

const TitleRow = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
});

const RowTitle = styled("div")({
  fontSize: "14px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flex: 1,
  minWidth: 0,
});

const MetaLine = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "3px",
  fontSize: "12px",
  color: "var(--mui-palette-text-secondary)",
  overflow: "hidden",
});

const MetaItem = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "3px",
  overflow: "hidden",
  flexShrink: 0,
  "&:last-child": {
    flexShrink: 1,
    overflow: "hidden",
  },
});

const MetaText = styled("span")({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const AttendeeTag = styled("span")({
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  color: "var(--mui-palette-text-secondary)",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 8px",
  flexShrink: 0,
  whiteSpace: "nowrap",
});

const SkeletonRow = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "10px 14px",
  borderBottom: "1px solid var(--mui-palette-divider)",
  "&:last-child": { borderBottom: "none" },
});

export function EventListRowSkeleton() {
  return (
    <SkeletonRow>
      <Skeleton
        variant="rectangular"
        width={40}
        height={52}
        sx={{ borderRadius: "5px", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="80%" height={16} sx={{ marginTop: "4px" }} />
      </div>
    </SkeletonRow>
  );
}

interface EventListRowProps {
  event: Event.AsObject;
}

export default function EventListRow({ event }: EventListRowProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([DASHBOARD]);

  const now = new Date();
  const startDate = timestamp2Date(event.startTime!);
  const endDate = event.endTime ? timestamp2Date(event.endTime) : null;
  const isOngoing = endDate !== null && startDate <= now && endDate >= now;
  const isToday = !isOngoing && startDate.toDateString() === now.toDateString();
  const todayLabel = t("dashboard:events.today_label");
  const nowLabel = t("dashboard:now_label");
  const chipLabel = isOngoing ? nowLabel : todayLabel;
  const chipFontSize =
    chipLabel.length <= 5 ? 9 : chipLabel.length <= 7 ? 8 : 7;
  const month = localizeMonthAbbreviation(startDate, {
    locale,
    timezone: BROWSER_TIMEZONE,
    capitalize: true,
  });
  const day = startDate.getDate();

  const timeStr = localizeDateTime(startDate, {
    locale,
    timezone: BROWSER_TIMEZONE,
    includeDate: false,
    includeTime: true,
  });

  const location = event.offlineInformation
    ? event.offlineInformation.address
    : t("dashboard:events.location_online_label");

  return (
    <RowLink href={routeToEvent(event.eventId, event.slug)}>
      <DateChip data-today={isToday || isOngoing || undefined}>
        <DateMonth
          $labelFontSize={isToday || isOngoing ? chipFontSize : undefined}
        >
          {isOngoing ? nowLabel : isToday ? todayLabel : month}
        </DateMonth>
        {!isToday && !isOngoing && <DateDay>{day}</DateDay>}
      </DateChip>
      <ContentWrapper>
        <TitleRow>
          <RowTitle>{event.title}</RowTitle>
          <AttendeeTag>
            <Group sx={{ fontSize: "11px" }} />
            {event.goingCount}
          </AttendeeTag>
          <ChevronRight
            sx={{
              fontSize: "16px",
              color: "var(--mui-palette-text-secondary)",
              flexShrink: 0,
            }}
          />
        </TitleRow>
        <MetaLine>
          <MetaItem>
            <Schedule sx={{ fontSize: "12px" }} />
            <MetaText>{timeStr}</MetaText>
          </MetaItem>
          <MetaItem>
            <Place sx={{ fontSize: "12px" }} />
            <MetaText>{location}</MetaText>
          </MetaItem>
        </MetaLine>
      </ContentWrapper>
    </RowLink>
  );
}
