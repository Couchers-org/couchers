import { LiteUser } from "@couchers/services/api";
import { BlockedUser } from "@couchers/services/blocking";
import { styled } from "@mui/material";

import UserSummary from "@/components/UserSummary";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject | BlockedUser.AsObject;
  isProfileLink?: boolean;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const StyledFriendItem = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  padding: `0 ${theme.spacing(1)}`,
}));

const FriendSummaryView = ({
  children,
  friend,
  isProfileLink,
}: FriendSummaryViewProps) => {
  return friend ? (
    <>
      <StyledFriendItem data-testid={FRIEND_ITEM_TEST_ID}>
        <UserSummary
          headlineComponent="h3"
          user={friend}
          isProfileLink={isProfileLink}
        />
        {children}
      </StyledFriendItem>
    </>
  ) : null;
};

export default FriendSummaryView;
