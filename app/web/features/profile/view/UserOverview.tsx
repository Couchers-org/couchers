import { LinkOutlined } from "@mui/icons-material";
import { Card, CardActions, styled, Theme, Tooltip, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import CopyButton from "components/CopyButton";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import IconText from "components/IconText";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import StyledLink from "components/StyledLink";
import { useLogEvent } from "features/analytics/hooks";
import { hostingStatusLabels, meetupStatusLabels } from "features/profile/constants";
import { useTranslation } from "i18n";
import { localizeTimeOnly, localizeTimeZone } from "i18n/datetimes";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import React from "react";
import { routeToEditProfile, routeToUser } from "routes";
import { Temporal } from "temporal-polyfill";

import { useProfileUser } from "../hooks/useProfileUser";
import { Badges } from "./Badges";
import ProfileStats from "./ProfileStats";
import { ResponseRateLabel } from "./userLabels";

const StyledCard = styled(Card)(({ theme }) => ({
  flexShrink: 0,
  borderRadius: 16,
  border: "1px solid var(--mui-palette-divider)",
  boxShadow: "none",
  padding: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(1),
    width: "100%",
  },
}));

// fills most of the card on bigger screens, but stays small on phones so the profile starts sooner
const avatarSize = (theme: Theme) => ({
  maxWidth: "75%",
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    width: 148,
  },
});

const StyledAvatarContainer = styled("div")(({ theme }) => avatarSize(theme));

const ClickableAvatarContainer = styled(Link)(({ theme }) => ({
  ...avatarSize(theme),
  display: "block",
  cursor: "pointer",
  transition: "transform 0.2s ease-in-out, opacity 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
    opacity: 0.8,
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

const StyledWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(2),
  "& h1": {
    textAlign: "center",
    marginBottom: theme.spacing(0.5),
  },
}));

const StyledIntro = styled(Typography)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  textAlign: "center",
  marginBottom: theme.spacing(1),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch",
  gap: theme.spacing(0.2),
  padding: theme.spacing(0.5),
  "&.MuiCardActions-root > *": {
    marginLeft: 0,
    marginRight: 0,
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
}));

const StyledSubtleLine = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(1),
  color: "var(--mui-palette-text-secondary)",
}));

const StyledInfo = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));

type UserOverviewProps = {
  showHostAndMeetAvailability: boolean;
  actions?: React.ReactNode;
  isOwnProfile?: boolean;
  isAvatarProfileLink?: boolean;
};

// @todo: move this into /components and decouple it from features/profile because it's used
//        from the dashboard as well
export default function UserOverview({
  showHostAndMeetAvailability,
  actions,
  isOwnProfile = false,
  isAvatarProfileLink = true,
}: UserOverviewProps) {
  const { t, i18n } = useTranslation([GLOBAL, PROFILE]);
  const logEvent = useLogEvent();
  const user = useProfileUser();

  const shouldMakeAvatarClickable = isOwnProfile && !user.avatarUrl;
  const localTime = user.timezone
    ? localizeTimeOnly(Temporal.Now.plainDateTimeISO(user.timezone), i18n.language)
    : null;

  return (
    <StyledCard>
      {shouldMakeAvatarClickable ? (
        <Tooltip title={t("profile:click_to_add_photo")} arrow placement="top">
          <ClickableAvatarContainer href={`${routeToEditProfile()}#gallery`}>
            <Avatar user={user} highRes grow isProfileLink={false} />
          </ClickableAvatarContainer>
        </Tooltip>
      ) : (
        <StyledAvatarContainer>
          <Avatar user={user} highRes grow isProfileLink={isAvatarProfileLink} />
        </StyledAvatarContainer>
      )}

      <StyledWrapper>
        <StyledIntro variant="h1" sx={{ gap: 0.5 }}>
          {user.name}
          {user.hasStrongVerification && <StrongVerificationBadge />}
        </StyledIntro>
        {user.city && (
          // inline, not flex, so the pin stays beside the city when a long city wraps
          <Typography sx={{ textAlign: "center", textWrap: "balance", overflowWrap: "break-word", marginBottom: 0.5 }}>
            <LocationIcon color="primary" sx={{ fontSize: "1em", verticalAlign: "-0.125em", marginInlineEnd: 0.5 }} />
            {user.city}
          </Typography>
        )}
        <StyledSubtleLine>
          <Typography
            variant="body2"
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              // tighter than the default icon button so the link icon sits right by the username
              "& .MuiIconButton-root": { padding: "2px" },
              "& svg": { display: "block" },
            }}
          >
            <StyledLink href={routeToUser(user.username)} sx={{ lineHeight: 1 }}>
              @{user.username}
            </StyledLink>
            <CopyButton
              text={`${typeof window !== "undefined" ? window.location.origin : ""}${routeToUser(user.username)}`}
              label={t("profile:copy_profile_link.button_a11y")}
              icon={<LinkOutlined sx={{ fontSize: 16 }} />}
              onCopy={(succeeded) =>
                logEvent("profile.link_copied", { user_id: user.userId, is_own_profile: isOwnProfile, succeeded })
              }
            />
          </Typography>
          {localTime && (
            <>
              <Typography variant="body2" component="span" aria-hidden>
                ·
              </Typography>
              <Tooltip
                title={localizeTimeZone(user.timezone, i18n.language, { short: false, capitalize: true })}
                placement="top"
                arrow
              >
                <Typography variant="body2" component="span">
                  {t("profile:overview_local_time", { time: localTime })}
                </Typography>
              </Tooltip>
            </>
          )}
        </StyledSubtleLine>
        <Badges user={user} />
        <ProfileStats user={user} />
      </StyledWrapper>

      <Divider />

      {actions && <StyledCardActions>{actions}</StyledCardActions>}

      {showHostAndMeetAvailability && (
        <>
          <IconText
            icon={CouchIcon}
            iconColor="primary"
            text={hostingStatusLabels(t)[user.hostingStatus || HostingStatus.HOSTING_STATUS_UNKNOWN]}
          />
          <IconText
            icon={LocationIcon}
            iconColor="primary"
            text={meetupStatusLabels(t)[user.meetupStatus || MeetupStatus.MEETUP_STATUS_UNKNOWN]}
          />
        </>
      )}

      {Boolean(showHostAndMeetAvailability || actions) && <Divider spacing={3} />}

      {process.env.NEXT_PUBLIC_IS_VERIFICATION_ENABLED && (
        <>
          <BarWithHelp
            value={user.communityStanding || 0}
            label={t("global:community_standing")}
            description={t("global:community_standing_description")}
          />
          <BarWithHelp
            value={user.verification || 0}
            label={t("global:verification_score")}
            description={t("global:verification_score_description")}
          />
        </>
      )}
      <StyledInfo>
        <ResponseRateLabel user={user} />
      </StyledInfo>
    </StyledCard>
  );
}
