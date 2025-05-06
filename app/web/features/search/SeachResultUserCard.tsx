import { styled, Tooltip, Typography } from "@mui/material";
import { FlexboxProps, useMediaQuery } from "@mui/system";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import StyledLink from "components/StyledLink";
import { ResponseRateText } from "features/profile/view/userLabels";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { User } from "proto/api_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { routeToUser } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import stripMarkdown from "utils/stripMarkdown";
import { hourMillis, timeAgoI18n } from "utils/timeAgo";

import HostMeetupReferenceStatus from "./HostMeetupReferenceStatus";
import { aboutText, truncateWithEllipsis } from "./utils/constants";

interface SearchResultUserCardProps {
  isHighlighted?: boolean;
  onUserCardClick: (userId: number) => void;
  user: User.AsObject;
}

const StyledCard = styled("div", {
  shouldForwardProp: (prop) => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  display: "flex",
  flexDirection: "column",
  border: isHighlighted ? `2px solid ${theme.palette.secondary.main}` : "none",
  borderRadius: 8,
  boxShadow: "0 0 4px rgba(0, 0, 0, 0.25)",
  paddingTop: theme.spacing(1),
  height: "100%",
  width: "100%",
}));

const StyledTopContent = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  padding: theme.spacing(0.5, 2, 1),
  flexShrink: 0,
}));

const StyledBottomContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: theme.spacing(0, 2, 1),
  width: "100%",
  wordBreak: "break-word",

  [theme.breakpoints.down("md")]: {
    fontSize: ".9rem",
  },

  [theme.breakpoints.down("sm")]: {
    fontSize: ".82rem",
  },
}));

const StyledCardHeader = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "1.2rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  wordBreak: "break-word",
}));

const StyledOpenInNewIcon = styled(OpenInNewIcon)(() => ({
  height: "1rem",
  width: "1rem",
}));

const FlexRow = styled("div")<{
  alignItems?: FlexboxProps["alignItems"];
  justifyContent?: FlexboxProps["justifyContent"];
}>(({ alignItems, justifyContent }) => ({
  display: "flex",
  alignItems: alignItems || "flex-start",
  flexGrow: 1,
  justifyContent: justifyContent || "flex-start",
}));

const FlexColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

const UserDetailsRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.grey[600],
  fontSize: "1.2rem",
  marginTop: "auto",
  justifyContent: "space-between",
  width: "100%",
}));

const HaikuContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center", // vertical centering
  alignItems: "center",
  fontFamily: "Georgia, serif",
  fontStyle: "italic",
  whiteSpace: "pre-line",
  lineHeight: 1.8,
  padding: theme.spacing(1),
  color: theme.palette.text.primary,
  opacity: 0.2,
  textAlign: "center",
  height: "100%",
}));

const generateAboutText = (
  user: User.AsObject,
  t: TFunction,
  isMobile: boolean,
) => {
  const missingAbout = user.aboutMe.length === 0;
  const hasPhoto = user.avatarUrl.length > 0;

  if (missingAbout && !hasPhoto) {
    return (
      <HaikuContainer>
        <Typography
          variant="body1"
          sx={{
            [theme.breakpoints.down("md")]: {
              fontSize: ".9rem",
            },

            [theme.breakpoints.down("sm")]: {
              fontSize: ".82rem",
            },
          }}
        >
          {t("profile:incomplete_profile_haiku")}
        </Typography>
      </HaikuContainer>
    );
  } else {
    return (
      <LinesEllipsis
        maxLine={isMobile ? 3 : 7}
        text={stripMarkdown(aboutText(user, t))}
      />
    );
  }
};

const SearchResultUserCard = ({
  isHighlighted = false,
  onUserCardClick,
  user,
}: SearchResultUserCardProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation([GLOBAL, PROFILE]);

  const handleUserCardClick = () => {
    onUserCardClick(user.userId);
  };

  return (
    <StyledCard isHighlighted={isHighlighted} onClick={handleUserCardClick}>
      <StyledTopContent>
        <Avatar openInNewTab user={user} />
        <FlexColumn>
          <StyledCardHeader variant="h2">
            <FlexRow alignItems="center">
              <StyledLink
                aria-label={t("profile:open_profile_new_tab")}
                href={routeToUser(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: "1.1rem" }}
              >
                <LinesEllipsis text={user.name} maxLine={1} />
              </StyledLink>
              {user.hasStrongVerification ? <StrongVerificationBadge /> : null}
            </FlexRow>
            <StyledLink
              aria-label={t("profile:open_profile_new_tab")}
              href={routeToUser(user.username)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Tooltip title={t("profile:open_profile_new_tab")}>
                <StyledOpenInNewIcon
                  sx={{
                    "&:hover": {
                      color: theme.palette.primary.dark,
                    },
                  }}
                />
              </Tooltip>
            </StyledLink>
          </StyledCardHeader>
          <FlexRow justifyContent="space-between">
            <Tooltip title={`${user.age}, ${user.gender}, ${user.city}`}>
              <Typography variant="body2">
                {`${user.age}, ${user.gender}, ${truncateWithEllipsis(user.city)}`}
              </Typography>
            </Tooltip>
          </FlexRow>
        </FlexColumn>
      </StyledTopContent>
      <StyledBottomContent>
        <HostMeetupReferenceStatus
          hostingStatus={user.hostingStatus}
          meetupStatus={user.meetupStatus}
          numberReferences={user.numReferences}
        />
        {generateAboutText(user, t, isMobile)}
        <FlexRow alignItems="flex-end" justifyContent="space-between">
          <UserDetailsRow>
            <Typography variant="body2">
              {user.lastActive
                ? `Active: ` +
                  timeAgoI18n({
                    input: timestamp2Date(user.lastActive),
                    t,
                    fuzzy: {
                      millis: hourMillis,
                      translationKey: "relative_time.less_than_one_hour_ago",
                    },
                  })
                : t("last_active_false")}
            </Typography>
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
