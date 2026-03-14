import { styled, Tooltip, Typography } from "@mui/material";
import { FlexboxProps } from "@mui/system";
import Avatar from "components/Avatar";
import { OpenInNewIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import { ResponseRateText } from "features/profile/view/userLabels";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { TFunction } from "i18next";
import { SearchUser } from "proto/search_pb";
import LinesEllipsis from "react-lines-ellipsis";
import { routeToUser } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import { useIsNativeEmbed } from "utils/nativeLink";
import stripMarkdown from "utils/stripMarkdown";
import { timeAgo, TimeUnit } from "utils/timeAgo";
import useIsScreenSmallerThan from "utils/useIsScreenSmallerThan";

import HostMeetupReferenceStatus from "./HostMeetupReferenceStatus";
import { aboutText, truncateWithEllipsis } from "./utils/constants";

interface SearchResultUserCardProps {
  isHighlighted?: boolean;
  onUserCardClick: (userId: number) => void;
  user: SearchUser.AsObject;
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
      />
    );
  }
};

const SearchResultUserCard = ({
  isHighlighted = false,
  onUserCardClick,
  user,
}: SearchResultUserCardProps) => {
  const isMobile = useIsScreenSmallerThan("MOBILE");
  const isNativeEmbed = useIsNativeEmbed();
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, PROFILE]);

  const handleUserCardClick = () => {
    onUserCardClick(user.userId);
  };

  return (
    <StyledCard isHighlighted={isHighlighted} onClick={handleUserCardClick}>
      <StyledTopContent>
        <Avatar openInNewTab user={user} />
        <FlexColumn>
          <FlexRow justifyContent="space-between" alignItems="center">
            <FlexRow alignItems="center">
              <StyledLink
                aria-label={t("profile:open_profile_new_tab")}
                href={routeToUser(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: "1.1rem", overflow: "hidden" }}
                onClick={(e) => e.stopPropagation()}
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
              </StyledLink>
            </FlexRow>
            {!isNativeEmbed && (
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
