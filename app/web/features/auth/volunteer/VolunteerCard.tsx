import { Avatar, Card, CardContent, styled, Typography } from "@mui/material";
import { PinIcon } from "components/Icons";
import IconText from "components/IconText";
import StyledLink from "components/StyledLink";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { theme } from "theme";

import { getLinkTypeIcon } from "./utils";

const VolunteerCardWrapper = styled("div")(() => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: "400px",
}));

const StyledVolunteerCard = styled(Card)(() => ({
  height: "13rem",
  border: `1px solid ${theme.palette.grey[400]}`,
}));

const StyledCardContent = styled(CardContent)(() => ({
  display: "flex",
}));

const DetailDiv = styled("div")(() => ({
  display: "flex",
  flexFlow: "column nowrap",
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: theme.typography.pxToRem(96),
  height: theme.typography.pxToRem(96),
}));

const VolunteerStatus = styled("div")(() => ({
  marginTop: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

const LocationText = styled(Typography)(() => ({
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

interface VolunteerCardProps {
  volunteerInfo: GetMyVolunteerInfoRes.AsObject;
}

export default function VolunteerCard({ volunteerInfo }: VolunteerCardProps) {
  const { t } = useTranslation([AUTH]);
  const { data: currentUser } = useCurrentUser();

  const LinkIcon = getLinkTypeIcon(volunteerInfo.linkType);

  return (
    <VolunteerCardWrapper>
      <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 1 }}>
        {t("auth:volunteer_management.card_preview_label")}
      </Typography>
      <StyledVolunteerCard variant="outlined">
        <StyledCardContent>
          <StyledAvatar alt={volunteerInfo.displayName || currentUser?.name} src={currentUser?.avatarUrl} />
          <DetailDiv>
            <Typography variant="h3" component="h3">
              {volunteerInfo.displayName || currentUser?.name}
            </Typography>
            <Typography variant="body1">{volunteerInfo.role}</Typography>
            <div>
              {(volunteerInfo.displayLocation || currentUser?.city) && (
                <IconText
                  icon={PinIcon}
                  text={
                    <LocationText variant="body1">
                      {volunteerInfo.displayLocation || currentUser?.city || ""}
                    </LocationText>
                  }
                />
              )}
              {volunteerInfo.linkUrl && (
                <IconText
                  icon={LinkIcon}
                  text={
                    <Typography variant="body1">
                      <StyledLink href={volunteerInfo.linkUrl}>{volunteerInfo.linkText}</StyledLink>
                    </Typography>
                  }
                />
              )}
            </div>
          </DetailDiv>
        </StyledCardContent>
      </StyledVolunteerCard>
      <VolunteerStatus>
        <Typography variant="body2" color="textSecondary">
          {volunteerInfo.stoppedVolunteering
            ? t("auth:volunteer_management.past_volunteer", {
                startDate: volunteerInfo.startedVolunteering,
                endDate: volunteerInfo.stoppedVolunteering,
              })
            : t("auth:volunteer_management.current_volunteer", {
                startDate: volunteerInfo.startedVolunteering,
              })}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {volunteerInfo.showOnTeamPage
            ? t(
                volunteerInfo.stoppedVolunteering
                  ? "auth:volunteer_management.shown_on_team_page_past"
                  : "auth:volunteer_management.shown_on_team_page_current",
              )
            : t("auth:volunteer_management.not_shown_on_team_page")}
        </Typography>
      </VolunteerStatus>
    </VolunteerCardWrapper>
  );
}
