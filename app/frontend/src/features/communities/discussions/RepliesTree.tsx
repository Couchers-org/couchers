import { Card, Typography } from "@material-ui/core";
import Avatar from "components/Avatar";
import useUsers from "features/userQueries/useUsers";
import { GetThreadRes } from "pb/threads_pb";
import { InfiniteData } from "react-query";
import { timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";

const useStyles = makeStyles((theme) => ({
  repliesListContainer: {
    marginBlockStart: theme.spacing(2),
  },
  replyContainer: {
    display: "flex",
    padding: theme.spacing(2),
    width: "100%",
  },
  replyContent: {
    display: "flex",
    flexDirection: "column",
    marginInlineStart: theme.spacing(3),
  },
  avatar: {
    height: "3rem",
    width: "3rem",
  },
}));

interface RepliesTreeProps {
  discussionThread: InfiniteData<GetThreadRes.AsObject>;
  users: NonNullable<ReturnType<typeof useUsers>["data"]>;
}

export default function RepliesTree({
  discussionThread,
  users,
}: RepliesTreeProps) {
  const classes = useStyles();

  return (
    <div className={classes.repliesListContainer}>
      {discussionThread.pages
        .flatMap((page) => page.repliesList)
        .map((reply) => {
          const user = users.get(reply.authorUserId);
          const replyDate = timestamp2Date(reply.createdTime!);
          const posted = replyDate ? timeAgo(replyDate, false) : "sometime";
          return (
            user && (
              <Card
                className={classes.replyContainer}
                key={reply.createdTime!.seconds}
              >
                <Avatar
                  user={user}
                  className={classes.avatar}
                  isProfileLink={false}
                />
                <div className={classes.replyContent}>
                  <Typography variant="body2">
                    By {users.get(reply.authorUserId)?.name ?? "Unknown user"} •{" "}
                    {posted}
                  </Typography>
                  <Typography variant="body1">{reply.content}</Typography>
                </div>
              </Card>
            )
          );
        })}
    </div>
  );
}
