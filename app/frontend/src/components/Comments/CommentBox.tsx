import { Card, makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import NewComment from "components/Comments/NewComment";
import Markdown from "components/Markdown";
import { Reply } from "pb/threads_pb";
import React, { useEffect, useState } from "react";
import { service } from "service/index";

const useStyles = makeStyles(() => ({
  card: {
    border: "1px solid",
    marginTop: "1em",
    padding: "1em",
  },
}));

interface CommentBoxProps {
  threadId: number;
}

// Reply with more Reply objects as children
interface MultiLevelReply extends Reply.AsObject {
  replies: Array<Reply.AsObject>;
  // page token, etc? not sure what's needed for react query
}

export default function CommentBox({ threadId }: CommentBoxProps) {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<Array<MultiLevelReply>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const thread = await service.threads.getThread(threadId);
        setComments(
          await Promise.all(
            thread.repliesList.map(async (reply) => {
              return {
                ...reply,
                replies:
                  reply.numReplies > 0
                    ? (await service.threads.getThread(reply.threadId))
                        .repliesList
                    : [],
              };
            })
          )
        );
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [threadId]);

  const handleComment = async (threadId: number, content: string) => {
    await service.threads.postReply(threadId, content);
    setLoading(true);
    try {
      const thread = await service.threads.getThread(threadId);
      setComments(
        await Promise.all(
          thread.repliesList.map(async (reply) => {
            return {
              ...reply,
              replies:
                reply.numReplies > 0
                  ? (await service.threads.getThread(reply.threadId))
                      .repliesList
                  : [],
            };
          })
        )
      );
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
    setLoading(false);
  };
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading && <CircularProgress />}
      {comments.map((comment) => (
        <>
          <Card className={classes.card}>
            Comment: by user id {comment.authorUserId}, posted at{" "}
            {comment.createdTime!.seconds}, {comment.numReplies} replies.
            <Markdown source={comment.content} />
            Replies:
            {comment.replies.map((reply) => (
              <>
                <Card className={classes.card}>
                  Reply: by user id {reply.authorUserId}, posted at{" "}
                  {reply.createdTime!.seconds}.
                  <Markdown source={reply.content} />
                </Card>
              </>
            ))}
            <NewComment
              onComment={(content) => handleComment(comment.threadId, content)}
            />
          </Card>
        </>
      ))}
      <NewComment onComment={(content) => handleComment(threadId, content)} />
    </>
  );
}
