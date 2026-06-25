import { styled } from "@mui/material";
import UserSummary from "components/UserSummary";
import { LiteUser } from "proto/api_pb";
import { BlockedUser } from "proto/blocking_pb";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject | BlockedUser.AsObject;
  isProfileLink?: boolean;
  cardRef?: React.Ref<HTMLDivElement>;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const StyledFriendItem = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  padding: `0 ${theme.spacing(1)}`,
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(1),
  },
}));

const ButtonWrapper = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },
}));

function FriendSummaryView({
  children,
  friend,
  isProfileLink,
  cardRef,
}: FriendSummaryViewProps) {
  return friend ? (
    <>
      <StyledFriendItem ref={cardRef} data-testid={FRIEND_ITEM_TEST_ID}>
        <UserSummary
          headlineComponent="h3"
          user={friend}
          isProfileLink={isProfileLink}
        />
        <ButtonWrapper>{children}</ButtonWrapper>
      </StyledFriendItem>
    </>
  ) : null;
}

export default FriendSummaryView;
