import {
  type ChipProps,
  type TooltipProps,
  Chip,
  Tooltip,
} from "@material-ui/core";
import Link, { type LinkProps } from "next/link";

export interface ToolChipLinkProps {
  label: string;
  description: string;
  href: string;
  color?: string;
  tooltipProps: TooltipProps;
  linkProps: LinkProps;
  chipProps: ChipProps;
}

export default function ToolChipLink({
  label,
  description,
  href,
  color,
  tooltipProps = {},
  linkProps = {},
  chipProps = {},
}: ToolChipLinkProps) {
  const tooltip = { title: description, ...tooltipProps };
  const link = { href, passHref: true, ...linkProps };
  const chip = {
    label,
    clickable: true,
    style: !!color ? { background: color } : {},
    ...chipProps,
  };

  // The <a> element is necessary to show the URL on hover
  return (
    <Tooltip {...tooltip}>
      <Link {...link}>
        <a>
          <Chip {...chip} />
        </a>
      </Link>
    </Tooltip>
  );
}
