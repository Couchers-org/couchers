import { makeStyles } from "@material-ui/core";
import UserSummary from "components/UserSummary";
import { User } from "pb/api_pb";

const useStyles = makeStyles((theme) => ({
  friendItem: {
    padding: `0 ${theme.spacing(1)}`,
  },
  friendLink: {
    color: theme.palette.text.primary,
    textDecoration: "none",
  },
  userLoadErrorAlert: {
    borderRadius: 0,
  },
}));

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: User.AsObject;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

function FriendSummaryView({ children, friend }: FriendSummaryViewProps) {
  const classes = useStyles();

  return friend ? (
    <div className={classes.friendItem} data-testid={FRIEND_ITEM_TEST_ID}>
      <UserSummary headlineComponent="h3" user={friend} />
      {children}
    </div>
  ) : null;
}

export default FriendSummaryView;
