import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Card, CircularProgress, Skeleton, styled, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import EllipsisMenu, { EllipsisMenuItem } from "components/EllipsisMenu";
import Markdown from "components/Markdown";
import MarkdownInput, { MarkdownInputProps } from "components/MarkdownInput";
import RelativeTime from "components/RelativeTime";
import { contentRefs } from "features/contentRefs";
import FlagButton from "features/FlagButton";
import CopyOnClick from "features/mod/CopyOnClick";
import ModVisibleComponent from "features/mod/ModVisibleComponent";
import { discussionKey, threadKey } from "features/queryKeys";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { Reply } from "proto/threads_pb";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { service } from "service";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

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

const StyledActionsContainer = styled("div")(() => ({
  alignItems: "flex-end",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  gridArea: "replyButton",
}));

const StyledEditForm = styled("form")(() => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
}));

const StyledEditButtons = styled("div")(() => ({
  display: "flex",
  gap: theme.spacing(1),
  justifyContent: "flex-end",
}));

export const COMMENT_TEST_ID = "comment";
export const REFETCH_LOADING_TEST_ID = "refetching";

interface CommentProps {
  comment: Reply.AsObject;
  topLevel?: boolean;
  parentThreadId: number;
  discussionId?: number;
}

interface EditCommentData {
  content: string;
}

export default function Comment({ topLevel = false, comment, parentThreadId, discussionId }: CommentProps) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useLiteUser(comment.authorUserId);

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
  const [isEditing, setIsEditing] = useState(false);
  const [ellipsisMenuAnchorEl, setEllipsisMenuAnchorEl] = useState<Element | null>(null);
  const commentFormRef = useRef<HTMLFormElement>(null);
  const resetInputRef: MarkdownInputProps["resetInputRef"] = useRef(null);

  useEffect(() => {
    if (showCommentForm && commentFormRef.current) {
      commentFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showCommentForm]);

  const { control, handleSubmit, reset } = useForm<EditCommentData>({
    mode: "onBlur",
    values: { content: comment.content },
  });

  const {
    mutate: updateReply,
    error: updateError,
    isPending: isUpdating,
  } = useMutation<Reply.AsObject, RpcError, EditCommentData>({
    mutationFn: ({ content }) => service.threads.updateReply(comment.threadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKey(parentThreadId) });
      if (discussionId) {
        queryClient.invalidateQueries({
          queryKey: discussionKey(discussionId),
        });
      }
      setIsEditing(false);
    },
  });

  const { mutate: deleteReply, isPending: isDeleting } = useMutation<void, RpcError>({
    mutationFn: () => service.threads.deleteReply(comment.threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKey(parentThreadId) });
      if (discussionId) {
        queryClient.invalidateQueries({
          queryKey: discussionKey(discussionId),
        });
      }
    },
  });

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const ellipsisMenuItems: EllipsisMenuItem[] = comment.canEdit
    ? [
        {
          icon: EditOutlined,
          label: t("communities:edit_comment"),
          onClick: () => setIsEditing(true),
          id: "edit-comment",
        },
        {
          icon: DeleteOutlined,
          label: t("communities:delete_comment"),
          onClick: () => deleteReply(),
          id: "delete-comment",
        },
      ]
    : [];

  if (isDeleting) {
    return null;
  }

  return (
    <>
      <StyledCommentContainer data-testid={COMMENT_TEST_ID}>
        {!comment.deleted && (
          <StyledButtonsContainer>
            <StyledAvatar user={user} />
            <FlagButton contentRef={contentRefs.comment(comment)} authorUser={comment.authorUserId} />
          </StyledButtonsContainer>
        )}
        <StyledCommentContent sx={comment.deleted ? { gridColumn: "1 / -1" } : undefined}>
          {comment.deleted ? (
            <Typography
              variant="body2"
              sx={{
                color: "var(--mui-palette-text-secondary)",
                fontStyle: "italic",
              }}
            >
              {t("communities:comment_deleted")}
            </Typography>
          ) : (
            <>
              {isUserLoading ? (
                <Skeleton />
              ) : (
                <Typography variant="body2">
                  {t("communities:by_creator", {
                    name: user?.name ?? t("communities:unknown_user"),
                  })}
                  {comment.createdTime && (
                    <>
                      {" "}
                      {"•"} <RelativeTime instant={comment.createdTime} capitalize={true} />
                    </>
                  )}
                  {comment.lastEdited && (
                    <>
                      {" "}
                      {"•"}{" "}
                      <Trans
                        t={t}
                        i18nKey="communities:comment_edited_date2"
                        components={{
                          timeAgo: <RelativeTime instant={comment.lastEdited} />,
                        }}
                      />
                    </>
                  )}
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
              {isEditing ? (
                <StyledEditForm onSubmit={handleSubmit((data) => updateReply(data))}>
                  {updateError && <Alert severity="error">{updateError.message}</Alert>}
                  <span
                    style={{
                      height: 1,
                      overflow: "hidden",
                      position: "absolute",
                      width: 1,
                    }}
                    id={`comment-${comment.threadId}-edit-label`}
                  >
                    {t("communities:write_comment_a11y_label")}
                  </span>
                  <MarkdownInput
                    control={control}
                    defaultValue={comment.content}
                    id={`comment-${comment.threadId}-edit`}
                    labelId={`comment-${comment.threadId}-edit-label`}
                    name="content"
                    required={t("communities:fill_out_comment")}
                    resetInputRef={resetInputRef}
                  />
                  <StyledEditButtons>
                    <Button variant="outlined" onClick={handleCancelEdit}>
                      {t("global:cancel")}
                    </Button>
                    <Button loading={isUpdating} type="submit">
                      {t("global:save")}
                    </Button>
                  </StyledEditButtons>
                </StyledEditForm>
              ) : isUserLoading ? (
                <Skeleton />
              ) : (
                <Markdown source={comment.content} />
              )}
            </>
          )}
        </StyledCommentContent>
        {(topLevel || ellipsisMenuItems.length > 0) && !isEditing && !comment.deleted && (
          <StyledActionsContainer>
            {ellipsisMenuItems.length > 0 && (
              <EllipsisMenu
                idName={`comment-${comment.threadId}`}
                isMenuOpen={Boolean(ellipsisMenuAnchorEl)}
                menuAnchorEl={ellipsisMenuAnchorEl}
                onMenuOpen={(e) => setEllipsisMenuAnchorEl(e.currentTarget)}
                onMenuClose={() => setEllipsisMenuAnchorEl(null)}
                items={ellipsisMenuItems}
              />
            )}
            {topLevel && (
              <StyledReplyButton onClick={() => setShowCommentForm(true)}>{t("global:reply")}</StyledReplyButton>
            )}
          </StyledActionsContainer>
        )}
      </StyledCommentContainer>
      {isCommentsLoading ? (
        <CenteredSpinner />
      ) : (
        <StyledNestedCommentsContainer>
          {!showLoadMoreButton && isCommentsRefetching && <CircularProgress data-testid={REFETCH_LOADING_TEST_ID} />}
          {hasAtLeastOnePage(comments, "repliesList") && (
            <>
              {showLoadMoreButton && (
                <StyledLoadEarlierRepliesButton loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                  {t("communities:load_earlier_replies")}
                </StyledLoadEarlierRepliesButton>
              )}
              {comments.pages
                .flatMap((page) => page.repliesList)
                .reverse()
                .map((reply) => {
                  return <Comment key={reply.threadId} comment={reply} parentThreadId={comment.threadId} />;
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
