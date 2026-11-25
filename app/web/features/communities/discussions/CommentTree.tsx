import { styled, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { keepPreviousData } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { usePersistedState } from "platform/usePersistedState";
import { ThreadSortOrder } from "proto/threads_pb";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { useThread } from "../hooks";
import Comment from "./Comment";
import CommentForm from "./CommentForm";
import CommentSkeleton from "./CommentSkeleton";

const StyledCommentsListContainer = styled("div")(({ theme }) => ({
  "& > * + *": {
    marginBlockStart: theme.spacing(2),
  },
  padding: theme.spacing(0, 2),
  display: "flex",
  flexDirection: "column",
  marginBlockStart: theme.spacing(2),
  marginBlockEnd: theme.spacing(6),
  [theme.breakpoints.down("sm")]: {
    //break out of page padding
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
}));

const StyledHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const StyledSortToggle = styled(ToggleButtonGroup)(({ theme }) => ({
  padding: theme.spacing(0.375),
  borderRadius: 999,
  // same grey as the app's other toggle (HostRequestFeedbackCard)
  backgroundColor: "var(--mui-palette-grey-200)",
  "& .MuiToggleButtonGroup-grouped": {
    border: 0,
    borderRadius: 999,
    padding: theme.spacing(0.75, 1.75),
    textTransform: "none",
    color: "var(--mui-palette-text-secondary)",
  },
  "& .MuiToggleButtonGroup-grouped.Mui-selected": {
    color: "var(--mui-palette-text-primary)",
    backgroundColor: "var(--mui-palette-background-paper)",
  },
}));

const COMMENT_REFETCH_INTERVAL_MS = 30_000;

interface CommentTreeProps {
  threadId: number;
  title: string;
  discussionId?: number;
}

export default function CommentTree({ threadId, title, discussionId }: CommentTreeProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const [sortOrder, setSortOrder] = usePersistedState<ThreadSortOrder>(
    "comments.sort_order",
    ThreadSortOrder.THREAD_SORT_ORDER_OLDEST_FIRST,
  );
  const isNewestFirst = sortOrder !== ThreadSortOrder.THREAD_SORT_ORDER_OLDEST_FIRST;

  const {
    data: comments,
    error: commentsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCommentsLoading,
  } = useThread(threadId, sortOrder, {
    refetchInterval: COMMENT_REFETCH_INTERVAL_MS,
    // keep showing the comments while the other order loads, instead of flashing a spinner
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <StyledHeader>
        <Typography variant="h2">{title}</Typography>
        <StyledSortToggle
          size="small"
          exclusive
          value={sortOrder}
          onChange={(_, value: ThreadSortOrder | null) => value !== null && setSortOrder(value)}
          aria-label={t("communities:comment_sort.label")}
        >
          <ToggleButton value={ThreadSortOrder.THREAD_SORT_ORDER_NEWEST_FIRST}>
            {t("communities:comment_sort.newest")}
          </ToggleButton>
          <ToggleButton value={ThreadSortOrder.THREAD_SORT_ORDER_OLDEST_FIRST}>
            {t("communities:comment_sort.oldest")}
          </ToggleButton>
        </StyledSortToggle>
      </StyledHeader>
      {commentsError && <Alert severity="error">{commentsError.message}</Alert>}
      {isCommentsLoading ? (
        <StyledCommentsListContainer>
          {[0, 1, 2].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </StyledCommentsListContainer>
      ) : hasAtLeastOnePage(comments, "repliesList") ? (
        <StyledCommentsListContainer>
          {comments.pages
            .flatMap((page) => page.repliesList)
            .map((comment) => {
              return (
                <Comment
                  key={comment.threadId}
                  topLevel
                  comment={comment}
                  parentThreadId={threadId}
                  discussionId={discussionId}
                />
              );
            })}
          {hasNextPage && (
            <Button
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
              sx={{
                alignSelf: "center",
              }}
            >
              {isNewestFirst ? t("communities:show_older_comments") : t("communities:show_newer_comments")}
            </Button>
          )}
        </StyledCommentsListContainer>
      ) : (
        comments &&
        !commentsError && (
          <Typography variant="body1" sx={{ marginBlockEnd: theme.spacing(6) }}>
            {t("communities:no_comments")}
          </Typography>
        )
      )}
      <CommentForm shown threadId={threadId} />
    </>
  );
}
