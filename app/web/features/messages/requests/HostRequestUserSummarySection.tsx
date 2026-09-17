import { Chip, Skeleton, styled, Tooltip, Typography, useMediaQuery } from "@mui/material";
import Avatar from "components/Avatar";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import UserSummary from "components/UserSummary";
import { useTranslation } from "i18n";
import { localizeDateRange } from "i18n/datetimes";
import { MESSAGES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { HostRequest } from "proto/requests_pb";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { daysBetween } from "utils/date";
import truncateTextEllipsis from "utils/truncateTextEllipsis";

const StyledRequestedDatesWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  "& > *": {
    margin: 0,
  },
}));

const StyledSmallUserSummary = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1, 2),
}));

const StyledLargeUserSummary = styled("div")(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,

  [theme.breakpoints.down("md")]: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },

  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(1),
  },
}));

const StyledShortUserInfo = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginLeft: theme.spacing(2),
}));

const StyledNameCityRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const StyledDatesRow = styled("div")({
  display: "flex",
  alignItems: "center",
});

const StyledPublicTripChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: "0.75rem",
  fontWeight: 500,
  marginLeft: theme.spacing(1),
  backgroundColor: "rgba(0, 163, 152, 0.1)",
  color: "var(--mui-palette-primary-main)",
}));

const HostRequestUserSummarySection = ({
  hostRequest,
  otherUser,
  isOffer = false,
}: {
  hostRequest: HostRequest.AsObject | undefined;
  otherUser: LiteUser.AsObject | undefined;
  isOffer?: boolean;
}) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(MESSAGES);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const publicTripChip = isOffer ? (
    <StyledPublicTripChip label={t("host_request_item.public_trip_chip")} size="small" />
  ) : null;

  const smallUserSummarySection = (
    <StyledSmallUserSummary>
      {!otherUser ? (
        <Skeleton variant="circular" sx={{ height: "2rem", width: "2rem" }} />
      ) : (
        <Avatar style={{ height: "2rem", width: "2rem" }} user={otherUser} isProfileLink />
      )}
      <StyledShortUserInfo>
        <Typography component="div" variant="body2">
          {!otherUser ? (
            <Skeleton />
          ) : (
            <StyledNameCityRow>
              <Tooltip title={`${otherUser.name}, ${otherUser.city}`}>
                <div>{`${truncateTextEllipsis(otherUser.name, 25)}, ${truncateTextEllipsis(otherUser.city, 25)}`}</div>
              </Tooltip>
              {otherUser.hasStrongVerification && <StrongVerificationBadge />}
            </StyledNameCityRow>
          )}
        </Typography>
        {hostRequest && (
          <StyledDatesRow>
            <Typography component="span" variant="h3" sx={{ paddingRight: theme.spacing(1) }}>
              {localizeDateRange(
                Temporal.PlainDateTime.from(hostRequest.fromDate),
                Temporal.PlainDateTime.from(hostRequest.toDate),
                locale,
                { abbreviate: true },
              )}
            </Typography>
            {publicTripChip}
          </StyledDatesRow>
        )}
      </StyledShortUserInfo>
    </StyledSmallUserSummary>
  );

  const largeUserSummarySection = (
    <StyledLargeUserSummary>
      <UserSummary user={otherUser} smallAvatar={isMobile}>
        {hostRequest && (
          <StyledRequestedDatesWrapper>
            <Typography component="p" variant="h3" sx={{ paddingRight: theme.spacing(1) }}>
              {localizeDateRange(
                Temporal.PlainDateTime.from(hostRequest.fromDate),
                Temporal.PlainDateTime.from(hostRequest.toDate),
                locale,
                {
                  includeYear: "auto",
                },
              )}
            </Typography>
            <Typography component="p" variant="h3" sx={{ fontWeight: "initial" }}>
              (
              {t("host_request_view.request_duration", {
                count: daysBetween(
                  Temporal.PlainDate.from(hostRequest.fromDate),
                  Temporal.PlainDate.from(hostRequest.toDate),
                ),
              })}
              )
            </Typography>
            {publicTripChip}
          </StyledRequestedDatesWrapper>
        )}
      </UserSummary>
    </StyledLargeUserSummary>
  );

  return isMobile ? smallUserSummarySection : largeUserSummarySection;
};

export default HostRequestUserSummarySection;
