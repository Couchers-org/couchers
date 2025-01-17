import { Badge } from "@mui/material";
import React from "react";

interface NotificationBadgeProps {
  children?: React.ReactNode;
  count?: number;
}

export default function NotificationBadge({
  children,
  count,
}: NotificationBadgeProps) {
  return (
    <Badge badgeContent={count} color="primary" sx={{ right: "-0.8rem" }}>
      {children}
    </Badge>
  );
}
