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
    <Badge
      badgeContent={count}
      color="primary"
      sx={{
        "& .MuiBadge-badge": {
          fontSize: { xs: "0.65rem" },
          minWidth: { xs: 16 },
          height: { xs: 16 },
        },
      }}
    >
      {children}
    </Badge>
  );
}
