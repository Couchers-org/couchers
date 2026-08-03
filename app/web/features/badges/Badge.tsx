import { Chip, styled, Tooltip } from "@mui/material";
import { useProfileSheet } from "features/profile/ProfileSheetContext";
import Link from "next/link";
import { Badge as BadgeType } from "proto/resources_pb";
import { routeToBadge } from "routes";

interface BadgeProps {
  badge: BadgeType.AsObject;
}

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  marginInlineStart: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "&:hover": {
    cursor: "pointer",
  },
}));

export default function Badge({ badge }: BadgeProps) {
  const { openProfileUserId, openBadge } = useProfileSheet();
  const isInSheet = openProfileUserId !== null;

  if (isInSheet) {
    return (
      <StyledTooltip title={badge.description}>
        <Chip
          label={badge.name}
          onClick={() => openBadge(badge.id)}
          sx={{ background: badge.color, cursor: "pointer" }}
        />
      </StyledTooltip>
    );
  }

  return (
    <StyledTooltip title={badge.description}>
      <Chip label={badge.name} href={routeToBadge(badge.id)} component={Link} sx={{ background: badge.color }} />
    </StyledTooltip>
  );
}
