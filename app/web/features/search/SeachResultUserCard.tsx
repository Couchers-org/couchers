import { Card, styled, Typography } from "@mui/material";
import { FlexboxProps } from "@mui/system";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import StyledLink from "components/StyledLink";
import {
  hostingStatusLabels,
  meetupStatusLabels,
} from "features/profile/constants";
import { ResponseRateText } from "features/profile/view/userLabels";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { HostingStatus, MeetupStatus, User } from "proto/api_pb";
import { routeToUser } from "routes";
import { timestamp2Date } from "utils/date";
import stripMarkdown from "utils/stripMarkdown";
import { hourMillis, timeAgoI18n } from "utils/timeAgo";

import { aboutText } from "./utils/constants";

interface SearchResultUserCardProps {
  isHighlighted: boolean;
  user: User.AsObject;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  display: "flex",
  flexDirection: "column",
  border: isHighlighted ? `2px solid ${theme.palette.primary.main}` : "none",
  borderRadius: 8,
  boxShadow: "0 0 4px rgba(0, 0, 0, 0.25)",
  height: "100%",
  paddingTop: theme.spacing(1),
}));

const StyledTopContent = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2, 1),
  flexShrink: 0,
}));

const StyledBottomContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: theme.spacing(1, 2, 1),
}));

const StyledCardHeader = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "1.2rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

const StyledOpenInNewIcon = styled(OpenInNewIcon)(({ theme }) => ({
  height: "1.25rem",
  width: "1.25rem",
}));

const FlexRow = styled("div")<{ alignItems?: FlexboxProps["alignItems"] }>(
  ({ theme, alignItems }) => ({
    display: "flex",
    alignItems: alignItems || "flex-start",
    flexGrow: 1,
  }),
);

const FlexColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isNegative",
})<{ isNegative: boolean }>(({ theme, isNegative }) => ({
  fontWeight: 600,
  color: isNegative ? theme.palette.grey[100] : theme.palette.common.black,
  opacity: isNegative ? 0.5 : 0.65,
  fontSize: "0.875rem",

  "&:first-of-type": {
    marginRight: theme.spacing(1),
  },

  "&:last-of-type": {
    marginLeft: theme.spacing(1),
  },
}));

const VerticalLine = styled("div")(({ theme }) => ({
  color: theme.palette.grey[300],
}));

const BulletPoint = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

const UserDetailsRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.grey[600],
  fontSize: "1.2rem",
  marginTop: "auto",
}));

const SearchResultUserCard = ({
  isHighlighted,
  user,
}: SearchResultUserCardProps) => {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <StyledCard
      isHighlighted={isHighlighted}
      variant="outlined"
      square={false}
      elevation={0}
    >
      <StyledTopContent>
        <Avatar user={user} />
        <FlexColumn>
          <StyledCardHeader variant="h2">
            <div>
              {user.name}
              {user.hasStrongVerification ? <StrongVerificationBadge /> : null}
            </div>
            <StyledLink
              href={routeToUser(user.username)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <StyledOpenInNewIcon />
            </StyledLink>
          </StyledCardHeader>
          <FlexRow>
            <StyledTypography
              display="inline"
              variant="body1"
              isNegative={
                user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST
              }
            >
              {hostingStatusLabels(t)[user.hostingStatus]}
            </StyledTypography>
            <VerticalLine>|</VerticalLine>
            <StyledTypography
              display="inline"
              variant="body1"
              isNegative={
                user.meetupStatus ===
                MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP
              }
            >
              {meetupStatusLabels(t)[user.meetupStatus]}
            </StyledTypography>
          </FlexRow>
        </FlexColumn>
      </StyledTopContent>
      <StyledBottomContent>
        <Typography
          variant="body1"
          sx={{
            overflowWrap: "break-word",
            wordBreak: "break-word",
            flexFlowGrow: 1,
          }}
        >
          {stripMarkdown(aboutText(user, t))}
        </Typography>
        <FlexRow alignItems="flex-end">
          <UserDetailsRow>
            <Typography variant="body2">{`${user.numReferences >= 100 ? `100+` : user.numReferences} ${t("profile:heading.references").toLowerCase()}`}</Typography>
            <BulletPoint>•</BulletPoint>
            <Typography variant="body2">
              {user.lastActive
                ? timeAgoI18n({
                    input: timestamp2Date(user.lastActive),
                    t,
                    fuzzy: {
                      millis: hourMillis,
                      translationKey: "relative_time.less_than_one_hour_ago",
                    },
                  })
                : t("last_active_false")}
            </Typography>
            <BulletPoint>•</BulletPoint>
            <Typography variant="body2" sx={{ display: "flex" }}>
              {`${t("profile:response_rate_label")}: `}
              <ResponseRateText user={user} />
            </Typography>
          </UserDetailsRow>
        </FlexRow>
      </StyledBottomContent>
    </StyledCard>
  );
};

export default SearchResultUserCard;
