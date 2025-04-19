import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { useThread } from "../hooks";
import Comment from "./Comment";
import CommentForm from "./CommentForm";

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

interface CommentTreeProps {
  threadId: number;
}

export default function CommentTree({ threadId }: CommentTreeProps) {
  const { t } = useTranslation([COMMUNITIES]);

  const {
    data: comments,
    error: commentsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCommentsLoading,
  } = useThread(threadId);

  return (
    <>
      {commentsError && <Alert severity="error">{commentsError.message}</Alert>}
      {isCommentsLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(comments, "repliesList") ? (
        <StyledCommentsListContainer>
          {hasNextPage && (
            <Button
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
              sx={{
                alignSelf: "center",
              }}
            >
              {t("communities:load_earlier_comments")}
            </Button>
          )}
          {comments.pages
            .flatMap((page) => page.repliesList)
            .reverse()
            .map((comment) => {
              return (
                <Comment key={comment.threadId} topLevel comment={comment} />
              );
            })}
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
