import UserSummary from "components/UserSummary";
import { User } from "proto/api_pb";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  friendItem: {
    padding: `0 ${theme.spacing(1)}`,
  },
  friendLink: {
    color: theme.palette.text.primary,
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
