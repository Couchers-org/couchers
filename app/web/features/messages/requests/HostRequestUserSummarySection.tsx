import {
  Skeleton,
  styled,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Avatar from "components/Avatar";
import UserSummary from "components/UserSummary";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { HostRequest } from "proto/requests_pb";
import { Temporal } from "temporal-polyfill";
import { theme } from "theme";
import { daysBetween, localizeDateTimeRange } from "utils/date";
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

const HostRequestUserSummarySection = ({
  hostRequest,
  otherUser,
}: {
  hostRequest: HostRequest.AsObject | undefined;
  otherUser: LiteUser.AsObject | undefined;
}) => {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation(MESSAGES);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const smallUserSummarySection = (
    <StyledSmallUserSummary>
      {!otherUser ? (
        <Skeleton variant="circular" sx={{ height: "2rem", width: "2rem" }} />
      ) : (
        <Avatar
          style={{ height: "2rem", width: "2rem" }}
          user={otherUser}
          isProfileLink
        />
      )}
      <StyledShortUserInfo>
        <Typography component="div" variant="body2">
          {!otherUser ? (
            <Skeleton />
          ) : (
            <Tooltip
              title={`${otherUser.name}, ${otherUser.age}, ${otherUser.city}`}
            >
              <div>
                {`${truncateTextEllipsis(otherUser.name, 25)}, ${
                  otherUser.age
                }, ${truncateTextEllipsis(otherUser.city, 25)}`}
              </div>
            </Tooltip>
          )}
        </Typography>
        {hostRequest && (
          <Typography
            component="p"
            variant="h3"
            sx={{ paddingRight: theme.spacing(1) }}
          >
            {localizeDateTimeRange(
              Temporal.PlainDateTime.from(hostRequest.fromDate),
              Temporal.PlainDateTime.from(hostRequest.toDate),
              {
                locale,
                includeTime: false,
                abbreviate: true,
              },
            )}
          </Typography>
        )}
      </StyledShortUserInfo>
    </StyledSmallUserSummary>
  );

  const largeUserSummarySection = (
    <StyledLargeUserSummary>
      <UserSummary user={otherUser} smallAvatar={isMobile}>
        {hostRequest && (
          <StyledRequestedDatesWrapper>
            <Typography
              component="p"
              variant="h3"
              sx={{ paddingRight: theme.spacing(1) }}
            >
              {localizeDateTimeRange(
                Temporal.PlainDateTime.from(hostRequest.fromDate),
                Temporal.PlainDateTime.from(hostRequest.toDate),
                {
                  locale,
                  includeTime: false,
                },
              )}
            </Typography>
            <Typography
              component="p"
              variant="h3"
              sx={{ fontWeight: "initial" }}
            >
              (
              {t("host_request_view.request_duration", {
                count: daysBetween(
                  Temporal.PlainDate.from(hostRequest.toDate),
                  Temporal.PlainDate.from(hostRequest.fromDate),
                ),
              })}
              )
            </Typography>
          </StyledRequestedDatesWrapper>
        )}
      </UserSummary>
    </StyledLargeUserSummary>
  );

  return isMobile ? smallUserSummarySection : largeUserSummarySection;
};

export default HostRequestUserSummarySection;
