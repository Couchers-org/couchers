import { useFeatureValue } from "@growthbook/growthbook-react";
import { Box, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";

import BadgeUserList from "./BadgeUserList";

interface BadgeDetailProps {
  badgeId: string;
}

export default function BadgeDetail({ badgeId }: BadgeDetailProps) {
  const { t } = useTranslation([PROFILE]);
  const { badges, isLoading } = useBadges();

  const showModeratorBadge = useFeatureValue("show_moderator_badge", true);
  const isHidden = badgeId === "moderator" && !showModeratorBadge;

  if (isLoading) return <CenteredSpinner />;
  if (!badges || !(badgeId in badges) || isHidden) {
    return <Typography>{t("profile:badges.not_found")}</Typography>;
  }

  const badge = badges[badgeId];
  return (
    <>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
        <Badge badge={badge} />
        <Typography variant="body1">{badge.description}</Typography>
      </Box>
      <BadgeUserList badgeId={badgeId} />
    </>
  );
}
