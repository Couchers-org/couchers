import { Badge as BadgeType } from "@couchers/services/resources";
import { Chip, Tooltip, styled } from "@mui/material";

import { routeToBadge } from "@/routes";

export interface BadgeProps {
  badge: BadgeType.AsObject;
}

const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  marginInlineStart: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "&:hover": {
    cursor: "pointer",
  },
}));

const Badge = ({ badge }: BadgeProps) => {
  return (
    <StyledTooltip title={badge.description}>
      <Chip
        label={badge.name}
        href={routeToBadge(badge.id)}
        component="a"
        sx={{ background: badge.color }}
      />
    </StyledTooltip>
  );
};

export default Badge;
