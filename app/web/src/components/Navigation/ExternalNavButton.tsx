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
      target="_blank"
      rel="noreferrer noopener"
      className={classes.link}
    >
      <Typography variant={labelVariant} className={classes.label} noWrap>
        {label}
      </Typography>
    </a>
  );
}
