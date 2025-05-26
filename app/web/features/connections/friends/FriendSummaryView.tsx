import { styled } from "@mui/material";
import UserSummary from "components/UserSummary";
import { LiteUser } from "proto/api_pb";
import { BlockedUser } from "proto/blocking_pb";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject | BlockedUser.AsObject;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const StyledFriendItem = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  padding: `0 ${theme.spacing(1)}`,
}));

function FriendSummaryView({ children, friend }: FriendSummaryViewProps) {
  return friend ? (
    <>
      <StyledFriendItem data-testid={FRIEND_ITEM_TEST_ID}>
        <UserSummary headlineComponent="h3" user={friend} />
        {children}
      </StyledFriendItem>
    </>
  ) : null;
}

export default FriendSummaryView;
