import { Threads } from "@couchers/services";
import { Card, styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import NewComment from "@/components/Comments/NewComment";
import Markdown from "@/components/Markdown";
import log from "@/log";
import serviceClients from "@/serviceClients";
import { useErrorMessage } from "@/utils/error";

interface CommentBoxProps {
  threadId: bigint;
}

type CommentThread = Threads.Reply & { replies: Threads.Reply[] };

const StyledCard = styled(Card)(() => ({
  border: "1px solid",
  marginTop: "1em",
  padding: "1em",
  fontSize: "1.2em",
}));

const CommentBox = ({ threadId }: CommentBoxProps) => {
  const { t } = useTranslation();
  const { errorMessage, setError } = useErrorMessage(t);

  const [isLoading, setIsLoading] = useState(false);

  const [comments, setComments] = useState<CommentThread[]>([]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const thread = await serviceClients.threads.getThread({
          threadId,
        });

        const replies = await Promise.all(
          thread.replies.map<Promise<CommentThread>>(async (reply) => {
            let replies: Threads.Reply[] = [];

            if (reply.numReplies) {
              replies = (
                await serviceClients.threads.getThread({
                  threadId: reply.threadId,
                })
              ).replies;
            }

            return {
              ...reply,
              replies,
            };
          }),
        );

        setComments(replies);
      } catch (e) {
        log.error(e);
        setError(e);
      }
      setIsLoading(false);
    })();
  }, [setError, t, threadId]);

  const handleComment = async (threadId: bigint, content: string) => {
    await serviceClients.threads.postReply({
      threadId,
      content,
    });
    setIsLoading(true);
    try {
      const thread = await serviceClients.threads.getThread({
        threadId,
      });

      setComments(
        await Promise.all(
          thread.replies.map(async (reply) => {
            return {
              ...reply,
              replies:
                reply.numReplies > 0
                  ? (
                      await serviceClients.threads.getThread({
                        threadId: reply.threadId,
                      })
                    ).replies
                  : [],
            };
          }),
        ),
      );
    } catch (e) {
      log.error(e);
      setError(e);
    }
    setIsLoading(false);
  };
  return (
    <>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {isLoading && <CenteredSpinner />}
      {comments.map((comment) => (
        <>
          <StyledCard>
            Comment: by user id {comment.authorUserId}, posted at{" "}
            {comment.createdTime?.seconds}, {comment.numReplies} replies.
            <Markdown source={comment.content} />
            Replies:
            {comment.replies.map((reply) => (
              <>
                <StyledCard>
                  Reply: by user id {reply.authorUserId}, posted at{" "}
                  {reply.createdTime?.seconds}.
                  <Markdown source={reply.content} />
                </StyledCard>
              </>
            ))}
            <NewComment
              onComment={(content) => handleComment(comment.threadId, content)}
            />
          </StyledCard>
        </>
      ))}
      <NewComment onComment={(content) => handleComment(threadId, content)} />
    </>
  );
};

export default CommentBox;
