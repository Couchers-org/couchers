import { Reply } from "@couchers/services/threads";
import { Card, styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";

import Alert from "@/components/Alert";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import NewComment from "@/components/Comments/NewComment";
import Markdown from "@/components/Markdown";
import log from "@/log";
import { service } from "@/service";
import isGrpcError from "@/service/utils/isGrpcError";

interface CommentBoxProps {
  threadId: number;
}

// Reply with more Reply objects as children
interface MultiLevelReply extends Reply.AsObject {
  replies: Array<Reply.AsObject>;
  // page token, etc? not sure what's needed for react query
}

const StyledCard = styled(Card)(() => ({
  border: "1px solid",
  marginTop: "1em",
  padding: "1em",
  fontSize: "1.2em",
}));

const CommentBox = ({ threadId }: CommentBoxProps) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState<Array<MultiLevelReply>>([]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
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
            }),
          ),
        );
      } catch (e) {
        log.error(e);
        setError(isGrpcError(e) ? e.message : t("error.fatal_message"));
      }
      setIsLoading(false);
    })();
  }, [t, threadId]);

  const handleComment = async (threadId: number, content: string) => {
    await service.threads.postReply(threadId, content);
    setIsLoading(true);
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
          }),
        ),
      );
    } catch (e) {
      log.error(e);
      setError(isGrpcError(e) ? e.message : t("error.fatal_message"));
    }
    setIsLoading(false);
  };
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
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
