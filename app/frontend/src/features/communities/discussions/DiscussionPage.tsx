import { Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { useUser } from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { Discussion } from "pb/discussions_pb";
import { discussionKey } from "queryKeys";
import { useQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { service } from "service";
import { dateFormatter, timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";

import { CREATED_AT, PREVIOUS_PAGE, UNKNOWN_USER } from "../constants";
import CommentTree from "./CommentTree";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBlockEnd: theme.spacing(5),
    "& .tui-editor-contents": {
      marginBottom: theme.spacing(3),
    },
  },
  header: {
    alignItems: "center",
    display: "flex",
  },
  discussionTitle: {
    marginInlineStart: theme.spacing(2),
  },
  discussionContent: {
    margin: 0,
  },
  creatorContainer: {
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
    alignItems: "center",
    display: "flex",
    marginBlockEnd: theme.spacing(3),
  },
  creatorDetailsContainer: {
    display: "flex",
    flexDirection: "column",
  },
  avatar: {
    height: "3rem",
    width: "3rem",
  },
}));

export default function DiscussionPage() {
  const classes = useStyles();
  const { discussionId } = useParams<{
    discussionId: string;
    discussionSlug?: string;
  }>();
  const history = useHistory();

  const { data: discussion, error, isLoading: isDiscussionLoading } = useQuery<
    Discussion.AsObject,
    GrpcError
  >({
    queryKey: discussionKey(+discussionId),
    queryFn: () => service.discussions.getDiscussion(+discussionId),
  });

  const { data: discussionCreator, isLoading: isCreatorLoading } = useUser(
    discussion?.creatorUserId
  );

  return (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ? (
        <CircularProgress />
      ) : (
        discussion && (
          <div className={classes.root}>
            <div className={classes.header}>
              <HeaderButton
                onClick={() => history.goBack()}
                aria-label={PREVIOUS_PAGE}
              >
                <BackIcon />
              </HeaderButton>
              <PageTitle className={classes.discussionTitle}>
                {discussion.title}
              </PageTitle>
            </div>
            <Markdown source={discussion.content} />
            <div className={classes.creatorContainer}>
              <Avatar
                user={discussionCreator}
                className={classes.avatar}
                isProfileLink={false}
              />
              <div className={classes.creatorDetailsContainer}>
                {isCreatorLoading ? (
                  <Skeleton width={100} />
                ) : (
                  <Typography variant="body1">
                    {discussionCreator?.name ?? UNKNOWN_USER}
                  </Typography>
                )}
                {isCreatorLoading ? (
                  <Skeleton width={100} />
                ) : (
                  <Typography variant="body2">
                    {CREATED_AT}
                    {dateFormatter.format(timestamp2Date(discussion.created!))}
                  </Typography>
                )}
              </div>
            </div>
            <CommentTree threadId={discussion.thread!.threadId} />
          </div>
        )
      )}
    </>
  );
}
