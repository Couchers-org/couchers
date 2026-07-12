import { EventOutlined, PlaceOutlined } from "@mui/icons-material";
import { Box, Skeleton, styled, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Avatar from "components/Avatar";
import { useAuthContext } from "features/auth/AuthProvider";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { HostRequest } from "proto/requests_pb";
import { routeToHostRequest } from "routes";
import { Temporal } from "temporal-polyfill";
import {
  localizeDateTimeRange,
  localizeRelativeDays,
  UTC_TIMEZONE,
} from "utils/date";
import dayjs from "utils/dayjs";

const StyledCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1.5),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-background-paper)",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s",
  height: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
}));

const DaysChip = styled("span")<{ imminent: boolean }>(
  ({ theme, imminent }) => ({
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: "2px 8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginLeft: "auto",
    background: imminent
      ? alpha(theme.palette.secondary.main, 0.12)
      : "var(--mui-palette-grey-50)",
    color: imminent
      ? "var(--mui-palette-secondary-dark)"
      : "var(--mui-palette-text-secondary)",
  }),
);

const IdentityRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

const TextBlock = styled("div")({
  minWidth: 0,
});

const MetaRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: "1px dashed var(--mui-palette-divider)",
}));

const MetaDate = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  fontSize: 12,
  fontWeight: 500,
  color: "var(--mui-palette-text-primary)",
  minWidth: 0,
  overflow: "hidden",
}));

interface UpcomingStayCardProps {
  hostRequest: HostRequest.AsObject;
}

export function UpcomingStayCardSkeleton() {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: "10px",
        background: "var(--mui-palette-background-paper)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, pr: 7.5, mb: 1.5 }}>
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          sx={{ flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Skeleton height={16} sx={{ mb: 0.5 }} />
          <Skeleton height={12} width="60%" />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: 1.25,
          borderTop: "1px dashed var(--mui-palette-divider)",
        }}
      >
        <Skeleton height={14} width={90} />
        <Skeleton height={14} width={50} />
      </Box>
    </Box>
  );
}

export default function UpcomingStayCard({
  hostRequest,
}: UpcomingStayCardProps) {
  const { authState } = useAuthContext();
  const { data: currentUser } = useCurrentUser();
  const timezone = currentUser?.timezone ?? UTC_TIMEZONE;
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([DASHBOARD]);

  const isHost = authState.userId === hostRequest.hostUserId;
  const otherUserId = isHost
    ? hostRequest.surferUserId
    : hostRequest.hostUserId;
  const { data: otherUser, isLoading } = useLiteUser(otherUserId);

  const fromDate = dayjs.tz(hostRequest.fromDate, UTC_TIMEZONE);
  const toDate = dayjs.tz(hostRequest.toDate, UTC_TIMEZONE);
  const nights = toDate.diff(fromDate, "day");
  const today = dayjs().tz(timezone).startOf("day");
  const daysUntil = fromDate.diff(today, "day");
  const daysUntilEnd = toDate.diff(today, "day");
  const isOngoing = daysUntil <= 0 && daysUntilEnd >= 0;
  const isImminent = daysUntil <= 3;
  const relativeDaysLabel = (() => {
    const label = localizeRelativeDays(daysUntil, locale);
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();

  const dateRange = localizeDateTimeRange(
    Temporal.PlainDateTime.from(hostRequest.fromDate),
    Temporal.PlainDateTime.from(hostRequest.toDate),
    {
      locale,
      includeTime: false,
      abbreviate: true,
    },
  );

  const primary = isLoading ? (
    <Skeleton width={80} />
  ) : (
    (otherUser?.name ?? "—")
  );

  return (
    <Link
      href={routeToHostRequest(hostRequest.hostRequestId)}
      style={{
        display: "flex",
        textDecoration: "none",
        color: "inherit",
        height: "100%",
        width: "100%",
      }}
    >
      <StyledCard sx={{ flex: 1 }}>
        <IdentityRow>
          <Avatar user={otherUser} isProfileLink={false} />
          <TextBlock>
            <Typography
              variant="h3"
              noWrap
              sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}
            >
              {primary}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                color: "var(--mui-palette-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                overflow: "hidden",
              }}
            >
              {isLoading ? (
                <Skeleton width={60} />
              ) : (
                <>
                  <PlaceOutlined style={{ fontSize: 12, flexShrink: 0 }} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {otherUser?.city}
                  </span>
                </>
              )}
            </Typography>
          </TextBlock>
          {isImminent && (
            <DaysChip imminent>
              {isOngoing ? t("dashboard:now_label") : relativeDaysLabel}
            </DaysChip>
          )}
        </IdentityRow>
        <MetaRow>
          <MetaDate>
            <EventOutlined sx={{ fontSize: 13, flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {dateRange}
            </span>
          </MetaDate>
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontSize: 12,
              color: "var(--mui-palette-text-secondary)",
              flexShrink: 0,
            }}
          >
            {t("dashboard:stays.night_count", { count: nights })}
          </Typography>
        </MetaRow>
      </StyledCard>
    </Link>
  );
}
