import {
  Card,
  CircularProgress,
  Skeleton,
  styled,
  Typography,
} from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Markdown from "components/Markdown";
import FlagButton from "features/FlagButton";
import CopyOnClick from "features/mod/CopyOnClick";
import ModVisibleComponent from "features/mod/ModVisibleComponent";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Reply } from "proto/threads_pb";
import { useEffect, useRef, useState } from "react";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import { timeAgo } from "utils/timeAgo";

import { useThread } from "../hooks";
import CommentForm from "./CommentForm";

const StyledCommentContainer = styled(Card)(() => ({
  alignItems: "start",
  columnGap: theme.spacing(2),
  display: "grid",
  gridTemplateAreas: `
      "avatar content content"
      ". . replyButton"
    `,
  [theme.breakpoints.up("md")]: {
    gridTemplateAreas: `
        "avatar content replyButton"
      `,
  },
  gridTemplateColumns: "3rem minmax(0, 9fr) 1fr",
  gridTemplateRows: "auto",
  padding: theme.spacing(2),
  width: "100%",
}));

const StyledButtonsContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const StyledCommentContent = styled("div")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(0.5),
  },
  display: "flex",
  flexDirection: "column",
  gridArea: "content",
  marginInlineStart: theme.spacing(1),
}));

const StyledAvatar = styled(Avatar)(() => ({
  height: "3rem",
  gridArea: "avatar",
  width: "3rem",
}));

const StyledReplyButton = styled(Button)(() => ({
  gridArea: "replyButton",
  placeSelf: "end",
}));

const StyledNestedCommentsContainer = styled("div")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
  display: "flex",
  flexDirection: "column",
  marginBlockStart: theme.spacing(2),
  marginInlineStart: theme.spacing(3),
  "&": {
    marginInlineStart: `clamp(${theme.spacing(2)}, 5vw, ${theme.spacing(5)})`,
  },
}));

const StyledLoadEarlierRepliesButton = styled(Button)(() => ({
  alignSelf: "center",
}));

export const COMMENT_TEST_ID = "comment";
export const REFETCH_LOADING_TEST_ID = "refetching";

interface CommentProps {
  comment: Reply.AsObject;
  topLevel?: boolean;
}

export default function Comment({ topLevel = false, comment }: CommentProps) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([GLOBAL, COMMUNITIES]);
  const { data: user, isLoading: isUserLoading } = useLiteUser(
    comment.authorUserId,
  );

  const {
    data: comments,
    fetchNextPage,
    hasNextPage,
    isLoading: isCommentsLoading,
    isFetching: isCommentsFetching,
    isFetchingNextPage,
  } = useThread(comment.threadId, { enabled: topLevel });
  const isCommentsRefetching = !isCommentsLoading && isCommentsFetching;
  const showLoadMoreButton = topLevel && hasNextPage;

  const [showCommentForm, setShowCommentForm] = useState(false);
  const commentFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (showCommentForm && commentFormRef.current) {
      commentFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showCommentForm]);

  const replyDate = timestamp2Date(comment.createdTime!);
  const postedTime = timeAgo({ since: replyDate, t, locale });

  return (
    <>
      <StyledCommentContainer data-testid={COMMENT_TEST_ID}>
        <StyledButtonsContainer>
          <StyledAvatar user={user} />
          <FlagButton
            contentRef={`comment/${comment.threadId}`}
            authorUser={comment.authorUserId}
          />
        </StyledButtonsContainer>
        <StyledCommentContent>
          {isUserLoading ? (
            <Skeleton />
          ) : (
            <Typography variant="body2">
              {t("communities:by_creator", {
                name: user?.name ?? t("communities:unknown_user"),
              })}
              {` • ${postedTime}`}
              <ModVisibleComponent>
                {" "}
                •{" "}
                <code>
                  threadId:
                  <CopyOnClick text={comment.threadId.toString()} />
                </code>
              </ModVisibleComponent>
            </Typography>
          )}
          {isUserLoading ? <Skeleton /> : <Markdown source={comment.content} />}
        </StyledCommentContent>
        {topLevel && (
          <StyledReplyButton
            onClick={() => {
              setShowCommentForm(true);
            }}
          >
            {t("global:reply")}
          </StyledReplyButton>
        )}
      </StyledCommentContainer>
      {isCommentsLoading ? (
        <CenteredSpinner />
      ) : (
        <StyledNestedCommentsContainer>
          {!showLoadMoreButton && isCommentsRefetching && (
            <CircularProgress data-testid={REFETCH_LOADING_TEST_ID} />
          )}
          {hasAtLeastOnePage(comments, "repliesList") && (
            <>
              {showLoadMoreButton && (
                <StyledLoadEarlierRepliesButton
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {t("communities:load_earlier_replies")}
                </StyledLoadEarlierRepliesButton>
              )}
              {comments.pages
                .flatMap((page) => page.repliesList)
                .reverse()
                .map((reply) => {
                  return <Comment key={reply.threadId} comment={reply} />;
                })}
            </>
          )}
          {topLevel && (
            <CommentForm
              hideable
              onClose={() => setShowCommentForm(false)}
              ref={commentFormRef}
              shown={showCommentForm}
              threadId={comment.threadId}
            />
          )}
        </StyledNestedCommentsContainer>
      )}
    </>
  );
}
