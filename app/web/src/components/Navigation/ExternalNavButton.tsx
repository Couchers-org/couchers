import { Typography, TypographyProps } from "@material-ui/core";

import { useNavLinkStyles } from "./useNavLinkStyles";

interface ExternalNavButtonProps {
  route: string;
  label: string;
  labelVariant: Exclude<TypographyProps["variant"], undefined>;
}

export default function ExternalNavButton({
  route,
  label,
  labelVariant,
}: ExternalNavButtonProps) {
  const classes = useNavLinkStyles();
  return (
    <a
      href={route}
      className={classes.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Typography variant={labelVariant} className={classes.label} noWrap>
        {label}
      </Typography>
    </a>
  );
}
