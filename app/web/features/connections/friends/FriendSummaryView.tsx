import { styled, Theme } from "@mui/material";
import UserSummary from "components/UserSummary";
import { LiteUser } from "proto/api_pb";
import { BlockedUser } from "proto/blocking_pb";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject | BlockedUser.AsObject;
  /**
   * Compact rows stack their actions under the name and use a smaller avatar,
   * which is what the narrow sidebar on the connections page needs — a viewport
   * breakpoint can't tell how wide the column actually is.
   *
   * Pass false where the row has the full width of the page and a narrow action,
   * so a lone icon button isn't pushed onto a line of its own.
   */
  isCompact?: boolean;
  isProfileLink?: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const stacked = (theme: Theme) => ({
  flexDirection: "column" as const,
  gap: theme.spacing(1),
});

const fullWidthActions = {
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
};

const StyledFriendItem = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCompact",
})<{ isCompact: boolean }>(({ theme, isCompact }) => ({
  display: "flex",
  alignItems: "flex-start",
  padding: `0 ${theme.spacing(1)}`,
  // Wide rows still stack once the viewport itself gets narrow.
  ...(isCompact ? stacked(theme) : { [theme.breakpoints.down("md")]: stacked(theme) }),
}));

const ButtonWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "isCompact",
})<{ isCompact: boolean }>(({ theme, isCompact }) =>
  isCompact ? fullWidthActions : { [theme.breakpoints.down("md")]: fullWidthActions },
);

function FriendSummaryView({ children, friend, isCompact = true, isProfileLink, cardRef }: FriendSummaryViewProps) {
  return friend ? (
    <StyledFriendItem ref={cardRef} data-testid={FRIEND_ITEM_TEST_ID} isCompact={isCompact}>
      <UserSummary headlineComponent="h3" user={friend} isProfileLink={isProfileLink} smallAvatar={isCompact} />
      <ButtonWrapper isCompact={isCompact}>{children}</ButtonWrapper>
    </StyledFriendItem>
  ) : null;
}

export default FriendSummaryView;
