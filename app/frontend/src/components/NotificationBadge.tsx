import { Badge, makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  badge: {
    top: "50%",
    right: theme.spacing(-2.5),
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
