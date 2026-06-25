import { styled, Tooltip, Typography } from "@mui/material";
import { FlexboxProps, useMediaQuery } from "@mui/system";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import ProfileLink from "components/ProfileLink/ProfileLink";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import StyledLink from "components/StyledLink";
import { useImpressionRef, useLogEvent } from "features/analytics/hooks";
import { useSearchAnalytics } from "features/analytics/searchAnalyticsContext";
import {
  makeResultId,
  setSearchReferrer,
} from "features/analytics/searchAttribution";
import { ResponseRateText } from "features/profile/view/userLabels";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { SearchUser } from "proto/search_pb";
import { MouseEvent } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { routeToUser } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { useIsNativeEmbed } from "utils/nativeLink";
import stripMarkdown from "utils/stripMarkdown";
import { timeAgo, TimeUnit } from "utils/timeAgo";

import HostMeetupReferenceStatus from "./HostMeetupReferenceStatus";
import { aboutText, truncateWithEllipsis } from "./utils/constants";

interface SearchResultUserCardProps {
  isHighlighted?: boolean;
  onUserCardClick: (userId: number) => void;
  position: number;
  user: SearchUser.AsObject;
}

function responseRateBucket(user: SearchUser.AsObject): string | null {
  if (user.most) return "most";
  if (user.some) return "some";
  if (user.low) return "low";
  if (user.insufficientData) return "insufficient";
  return null;
}

function displayedAttributes(
  user: SearchUser.AsObject,
): Record<string, unknown> {
  const lastActive = user.lastActive
    ? timestamp2Date(user.lastActive).getTime()
    : null;
  return {
    has_avatar: user.avatarUrl.length > 0,
    has_about: user.profileSnippet.length > 0,
    profile_snippet_length: user.profileSnippet.length,
    age: user.age,
    gender: user.gender,
    hosting_status: user.hostingStatus,
    meetup_status: user.meetupStatus,
    num_references: user.numReferences,
    has_completed_profile: user.hasCompletedProfile,
    has_completed_my_home: user.hasCompletedMyHome,
    last_active_ms: lastActive,
    response_rate_bucket: responseRateBucket(user),
  };
}

const StyledCard = styled("div", {
  shouldForwardProp: (prop) => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  display: "flex",
  flexDirection: "column",
  border: isHighlighted
    ? `2px solid var(--mui-palette-secondary-main)`
    : "none",
  borderRadius: 8,
  boxShadow: "0 0 4px var(--mui-palette-divider)",
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
  overflow: "hidden",
}));

const FlexColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  overflow: "hidden",
}));

const UserDetailsRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: "var(--mui-palette-grey-600)",
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
  fontStyle: "italic",
  whiteSpace: "pre-line",
  lineHeight: 1.8,
  padding: theme.spacing(1),
  color: "var(--mui-palette-text-primary)",
  opacity: 0.2,
  textAlign: "center",
  flexGrow: 1,
}));

const generateAboutText = (
  user: SearchUser.AsObject,
  t: TFunction,
  isMobile: boolean,
) => {
  const missingAbout = user.profileSnippet.length === 0;
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
        basedOn="letters"
        style={{ wordBreak: "break-all", overflow: "hidden" }}
      />
    );
  }
};

const SearchResultUserCard = ({
  isHighlighted = false,
  onUserCardClick,
  position,
  user,
}: SearchResultUserCardProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isNativeEmbed = useIsNativeEmbed();
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, PROFILE]);

  const analytics = useSearchAnalytics();
  const logEvent = useLogEvent();
  const attrs = displayedAttributes(user);
  const resultId = analytics
    ? makeResultId(analytics.searchQueryId, user.userId, position)
    : null;

  const impressionProps = analytics
    ? {
        search_session_id: analytics.searchSessionId,
        search_query_id: analytics.searchQueryId,
        page_number: analytics.pageNumber,
        result_id: resultId,
        user_id: user.userId,
        position,
        surface: "list",
        ...attrs,
      }
    : {};
  const impressionRef = useImpressionRef(
    "search.result_impressed",
    impressionProps,
    { threshold: 0.5, minDurationMs: 250 },
  );

  const handleUserCardClick = () => {
    onUserCardClick(user.userId);
  };

  const handleClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!analytics || !resultId) return;
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest("a");
    if (!anchor) return;
    setSearchReferrer({
      searchSessionId: analytics.searchSessionId,
      searchQueryId: analytics.searchQueryId,
      resultId,
      userId: user.userId,
    });
    logEvent("search.result_clicked", {
      search_session_id: analytics.searchSessionId,
      search_query_id: analytics.searchQueryId,
      page_number: analytics.pageNumber,
      result_id: resultId,
      user_id: user.userId,
      position,
      surface: "list",
      opened_in_new_tab:
        anchor.getAttribute("target") === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.button === 1,
      was_selected_on_map: isHighlighted,
      ...attrs,
    });
  };

  return (
    <StyledCard
      isHighlighted={isHighlighted}
      onClick={handleUserCardClick}
      onClickCapture={handleClickCapture}
      ref={analytics ? impressionRef : undefined}
    >
      <StyledTopContent>
        <Avatar openInNewTab user={user} />
        <FlexColumn>
          <FlexRow justifyContent="space-between" alignItems="center">
            <FlexRow alignItems="center">
              <ProfileLink
                userId={user.userId}
                username={user.username}
                aria-label={t("profile:open_profile_new_tab")}
                openInNewTab
                style={{ fontSize: "1.1rem", overflow: "hidden" }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginRight: 1,
                  }}
                >
                  {user.name}
                </Typography>
              </ProfileLink>
              {user.hasStrongVerification && <StrongVerificationBadge />}
            </FlexRow>
            {!isNativeEmbed && !isMobile && (
              <StyledLink
                aria-label={t("profile:open_profile_new_tab")}
                href={routeToUser(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip title={t("profile:open_profile_new_tab")}>
                  <StyledOpenInNewIcon
                    sx={{
                      "&:hover": {
                        color: "var(--mui-palette-primary-dark)",
                      },
                    }}
                  />
                </Tooltip>
              </StyledLink>
            )}
          </FlexRow>

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
        <FlexRow
          alignItems="flex-end"
          justifyContent="space-between"
          sx={{ marginTop: 1.5 }}
        >
          <UserDetailsRow>
            <Typography variant="body2">
              {user.lastActive
                ? `${t("profile:active")}: ` +
                  timeAgo({
                    since: timestamp2Date(user.lastActive),
                    t,
                    locale,
                    minimumUnit: TimeUnit.Hours,
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
