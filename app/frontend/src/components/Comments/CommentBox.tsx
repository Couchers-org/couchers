import { Card, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";

import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import Markdown from "../../components/Markdown";
import { Reply } from "../../pb/threads_pb";
import { service } from "../../service";
import NewComment from "./NewComment";

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: "1em",
    padding: "1em",
    border: "1px solid",
  },
}));

interface CommentBoxProps {
  threadId: number;
}

// Reply with more Reply objects as children
interface MultiLevelReply extends Reply.AsObject {
  children: Array<Reply.AsObject>;
  // page token, etc? not sure what's needed for react query
}

export default function CommentBox({ threadId }: CommentBoxProps) {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<Array<MultiLevelReply>>([]);

  const refreshComments = async () => {
    setLoading(true);
    try {
      const thread = await service.threads.getThread(threadId);
      setComments(
        await Promise.all(
          thread.repliesList.map(async (reply) => {
            return {
              ...reply,
              children:
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

  useEffect(() => {
    refreshComments();
  }, [threadId]);

  const onComment = async (threadId: number, content: string) => {
    await service.threads.postReply(threadId, content);
    await refreshComments();
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
            {comment.children.map((reply) => (
              <>
                <Card className={classes.card}>
                  Reply: by user id {reply.authorUserId}, posted at{" "}
                  {reply.createdTime!.seconds}.
                  <Markdown source={reply.content} />
                </Card>
              </>
            ))}
            <NewComment
              onComment={(content) => onComment(comment.threadId, content)}
            />
          </Card>
        </>
      ))}
      <NewComment onComment={(content) => onComment(threadId, content)} />
    </>
  );
}
