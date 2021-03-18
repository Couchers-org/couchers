import { Badge, makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  badge: {
    [theme.breakpoints.up("sm")]: {
      right: theme.spacing(-3),
      top: "50%",
    },
  },
}));

interface NotificationBadgeProps {
  children?: React.ReactNode;
  count?: number;
}

export default function NotificationBadge({
  children,
  count,
}: NotificationBadgeProps) {
  const classes = useStyles();

  return (
    <Badge
      badgeContent={count}
      classes={{ badge: classes.badge }}
      color="primary"
    >
      {children}
    </Badge>
  );
}
