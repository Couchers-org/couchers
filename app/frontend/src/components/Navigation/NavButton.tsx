import { Typography, TypographyProps } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import { baseRoute, userRoute } from "routes";
import { useNavLinkStyles } from "./useNavLinkStyles";

interface NavButtonProps {
  route: string;
  label: string;
  labelVariant: Exclude<TypographyProps["variant"], undefined>;
}

export default function NavButton({
  route,
  label,
  labelVariant,
}: NavButtonProps) {
  const classes = useNavLinkStyles();
  return (
    <NavLink
      activeClassName={classes.selected}
      exact={route === baseRoute || route === userRoute}
      to={{ pathname: route }}
      className={classes.link}
    >
      <Typography variant={labelVariant} className={classes.label} noWrap>
        {label}
      </Typography>
    </NavLink>
  );
}

NavButton.defaultProps = {
  labelVariant: "h3",
};
