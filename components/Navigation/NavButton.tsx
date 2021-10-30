import { Typography, TypographyProps } from "@material-ui/core";
import classNames from "classnames";
import NotificationBadge from "components/NotificationBadge";
import { useRouter } from "next/dist/client/router";
import Link from "next/link";
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
  const router = useRouter();
  const isActive =
    route === baseRoute || route === userRoute
      ? router.pathname === route
      : router.pathname.includes(route);

  return (
    <Link href={route}>
      <a
        className={classNames(classes.link, {
          [classes.notification]: !!notificationCount,
          [classes.selected]: isActive,
        })}
      >
        <NotificationBadge count={notificationCount}>
          <Typography variant={labelVariant} className={classes.label} noWrap>
            {label}
          </Typography>
        </NotificationBadge>
      </a>
    </Link>
  );
}

NavButton.defaultProps = {
  labelVariant: "h3",
};
