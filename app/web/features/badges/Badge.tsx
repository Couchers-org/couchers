import ToolChipLink, { type ToolChipLinkProps } from "components/ToolChipLink";
import { Badge as BadgeType } from "proto/resources_pb";
import { routeToBadge } from "routes";

export interface BadgeProps {
  badge: BadgeType.AsObject;
  toolChipLinkProps: ToolChipLinkProps;
}

export default function Badge({ badge, toolChipLinkProps = {} }: BadgeProps) {
  const toolChipLink = {
    label: badge.name,
    description: badge.description,
    href: routeToBadge(badge.id),
    color: badge.color,
    ...toolChipLinkProps,
  };
  return <ToolChipLink {...toolChipLink} />;
}
