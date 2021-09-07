import { Typography, TypographyProps } from "@material-ui/core";
import classNames from "classnames";
import NotificationBadge from "components/NotificationBadge";
import { NavLink } from "react-router-dom";
import { baseRoute, userRoute } from "routes";

import { useNavLinkStyles } from "./useNavLinkStyles";

interface NavButtonProps {
  route: string;
  label: string;
  labelVariant: Exclude<TypographyProps["variant"], undefined>;
  notificationCount?: number;
}

export default function NavButton({
  route,
  label,
  labelVariant,
  notificationCount,
}: NavButtonProps) {
  const classes = useNavLinkStyles();
  return (
    <NavLink
      activeClassName={classes.selected}
      exact={route === baseRoute || route === userRoute}
      to={{ pathname: route }}
      className={classNames(classes.link, {
        [classes.notification]: !!notificationCount,
      })}
    >
      <NotificationBadge count={notificationCount}>
        <Typography variant={labelVariant} className={classes.label} noWrap>
          {label}
        </Typography>
      </NotificationBadge>
    </NavLink>
  );
}

NavButton.defaultProps = {
  labelVariant: "h3",
};
