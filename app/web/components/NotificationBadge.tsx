import { Badge } from "@material-ui/core";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  badge: {
    right: "-0.8rem",
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
