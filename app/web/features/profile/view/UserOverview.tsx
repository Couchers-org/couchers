import { ContentCopyOutlined } from "@mui/icons-material";
import { Box, Card, CardActions, IconButton, styled, Tooltip, Typography } from "@mui/material";
import Avatar from "components/Avatar";
import BarWithHelp from "components/Bar/BarWithHelp";
import Divider from "components/Divider";
import { CouchIcon, LocationIcon } from "components/Icons";
import StrongVerificationBadge from "components/StrongVerificationBadge";
import StyledLink from "components/StyledLink";
import { hostingStatusLabels, meetupStatusLabels } from "features/profile/constants";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import Link from "next/link";
import { HostingStatus, MeetupStatus } from "proto/api_pb";
import React, { useEffect, useRef, useState } from "react";
import { routeToEditProfile, routeToUser } from "routes";

import { useProfileUser } from "../hooks/useProfileUser";
import { Badges } from "./Badges";
import { Fact, FactList } from "./ProfileFacts";
import { ActivityFacts } from "./userLabels";

const StyledCard = styled(Card)(({ theme }) => ({
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(1),
    width: "100%",
  },
}));

const StyledAvatarContainer = styled("div")({
  maxWidth: "75%",
  margin: "0 auto",
});

const ClickableAvatarContainer = styled(Link)({
  maxWidth: "75%",
  margin: "0 auto",
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
});

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

const StyledInfo = styled(FactList)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  // the card is narrow, so keep facts at the phone size even on desktop
  "& .MuiTypography-root": {
    fontSize: "0.875rem",
  },
}));

function CopyProfileLinkButton({ username }: { username: string }) {
  const { t } = useTranslation([PROFILE]);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${routeToUser(username)}`);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    // the message sits beside the icon without taking space, so the centred username doesn't shift
    <Box component="span" sx={{ position: "relative", display: "inline-flex" }}>
      <Tooltip title={t("profile:copy_profile_link.button_a11y")} placement="top" arrow>
        <IconButton size="small" color="primary" aria-label={t("profile:copy_profile_link.button_a11y")} onClick={copy}>
          <ContentCopyOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Typography
        component="span"
        role="status"
        sx={{
          position: "absolute",
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          whiteSpace: "nowrap",
          fontSize: "0.8125rem",
          color: "var(--mui-palette-text-secondary)",
        }}
      >
        {copied && t("profile:copy_profile_link.copied_message")}
      </Typography>
    </Box>
  );
}

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
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();

  const shouldMakeAvatarClickable = isOwnProfile && !user.avatarUrl;

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
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, marginBottom: 1 }}>
          <StyledLink href={routeToUser(user.username)}>@{user.username}</StyledLink>
          <CopyProfileLinkButton username={user.username} />
        </Box>
        <StyledIntro>{user.city}</StyledIntro>
        <Badges user={user} />
      </StyledWrapper>

      <Divider />

      {actions && <StyledCardActions>{actions}</StyledCardActions>}

      <StyledInfo>
        {showHostAndMeetAvailability && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Fact icon={CouchIcon} muted={user.hostingStatus === HostingStatus.HOSTING_STATUS_CANT_HOST}>
              {hostingStatusLabels(t)[user.hostingStatus || HostingStatus.HOSTING_STATUS_UNKNOWN]}
            </Fact>
            <Fact icon={LocationIcon}>
              {meetupStatusLabels(t)[user.meetupStatus || MeetupStatus.MEETUP_STATUS_UNKNOWN]}
            </Fact>
          </Box>
        )}
        <ActivityFacts user={user} />
      </StyledInfo>

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
    </StyledCard>
  );
}
