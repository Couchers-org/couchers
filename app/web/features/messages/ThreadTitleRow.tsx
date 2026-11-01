import { styled } from "@mui/material";
import RelativeTime from "components/RelativeTime";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import React from "react";

const StyledRow = styled("span")(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  gap: theme.spacing(1),
  // lets the title truncate instead of pushing the time off the row
  "& > :first-of-type": {
    minWidth: 0,
  },
}));

const StyledRelativeTime = styled(RelativeTime, {
  shouldForwardProp: (prop) => prop !== "isUnread",
})<{ isUnread: boolean }>(({ theme, isUnread }) => ({
  ...theme.typography.caption,
  flexShrink: 0,
  marginInlineStart: "auto",
  whiteSpace: "nowrap",
  color: isUnread ? "var(--mui-palette-text-primary)" : "var(--mui-palette-text-secondary)",
  fontWeight: isUnread ? "bold" : "normal",
}));

interface ThreadTitleRowProps {
  children: React.ReactNode;
  latestMessageTime?: Timestamp.AsObject;
  isUnread: boolean;
}

/** A message list row's title, with the time of its latest message (which the list is ordered by). */
export default function ThreadTitleRow({ children, latestMessageTime, isUnread }: ThreadTitleRowProps) {
  return (
    <StyledRow>
      {children}
      {latestMessageTime && <StyledRelativeTime instant={latestMessageTime} isUnread={isUnread} />}
    </StyledRow>
  );
}
