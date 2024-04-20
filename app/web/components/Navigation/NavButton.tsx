import { Typography, TypographyProps } from "@material-ui/core";
import classNames from "classnames";
import NotificationBadge from "components/NotificationBadge";
import Link from "next/link";
import { useRouter } from "next/router";
import { baseRoute } from "routes";

import { useNavLinkStyles } from "./useNavLinkStyles";

interface NavButtonProps {
  route: string;
  label: string;
  labelVariant?: Exclude<TypographyProps["variant"], undefined>;
  notificationCount?: number;
}

export default function NavButton({
  route,
  label,
  labelVariant = "h3",
  notificationCount,
}: NavButtonProps) {
  const classes = useNavLinkStyles();
  const router = useRouter();
  const isActive =
    route === baseRoute
      ? router.asPath === route
      : router.asPath.includes(route);

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
