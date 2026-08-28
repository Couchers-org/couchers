import { styled, Theme } from "@mui/material";
import { EllipsisMenuItem } from "components/EllipsisMenu";
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
  isMobile?: boolean;
  isProfileLink?: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
  menuItems?: EllipsisMenuItem[];
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
  shouldForwardProp: (prop) => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) => ({
  display: "flex",
  alignItems: "flex-start",
  padding: `0 ${theme.spacing(1)}`,
  // Wide rows still stack once the viewport itself gets narrow.
  ...(isMobile ? stacked(theme) : { [theme.breakpoints.down("md")]: stacked(theme) }),
}));

const ButtonWrapper = styled("div", {
  shouldForwardProp: (prop) => prop !== "isMobile",
})<{ isMobile: boolean }>(({ theme, isMobile }) =>
  isMobile ? fullWidthActions : { [theme.breakpoints.down("md")]: fullWidthActions },
);

function FriendSummaryView({
  children,
  friend,
  isMobile = true,
  isProfileLink,
  cardRef,
  menuItems,
}: FriendSummaryViewProps) {
  return friend ? (
    <StyledFriendItem ref={cardRef} data-testid={FRIEND_ITEM_TEST_ID} isMobile={isMobile}>
      <UserSummary
        headlineComponent="h3"
        user={friend}
        isProfileLink={isProfileLink}
        smallAvatar={isMobile}
        menuItems={menuItems}
      />
      <ButtonWrapper isMobile={isMobile}>{children}</ButtonWrapper>
    </StyledFriendItem>
  ) : null;
}

export default FriendSummaryView;
