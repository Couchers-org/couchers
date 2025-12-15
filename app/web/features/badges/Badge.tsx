import { Chip, styled, Tooltip } from "@mui/material";
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
  return (
    <StyledTooltip title={badge.description}>
      <Chip
        label={badge.name}
        href={routeToBadge(badge.id)}
        component={Link}
        sx={{ background: badge.color }}
      />
    </StyledTooltip>
  );
}
