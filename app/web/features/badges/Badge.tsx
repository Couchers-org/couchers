import { Chip, Tooltip } from "@mui/material";
import Link from "next/link";
import { Badge as BadgeType } from "proto/resources_pb";
import { routeToBadge } from "routes";

export interface BadgeProps {
  badge: BadgeType.AsObject;
}

export default function Badge({ badge }: BadgeProps) {
  return (
    <Tooltip title={badge.description}>
      <Link href={routeToBadge(badge.id)} passHref={true}>
        <a>
          <Chip
            label={badge.name}
            clickable={true}
            sx={{ background: badge.color }}
          />
        </a>
      </Link>
    </Tooltip>
  );
}
