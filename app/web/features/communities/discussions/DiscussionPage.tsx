import { Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CircularProgress from "components/CircularProgress";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { discussionKey } from "features/queryKeys";
import { useUser } from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Discussion } from "proto/discussions_pb";
import { useQuery } from "react-query";
import { service } from "service";
import { dateFormatter, timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";

import CommunityBase from "../CommunityBase";
import CommunityPageSubHeader from "../CommunityPage/CommunityPageSubHeader";
import {
  COMMENTS,
  CREATED_AT,
  PREVIOUS_PAGE,
  UNKNOWN_USER,
} from "../constants";
import PageHeader from "../PageHeader";
import CommentTree from "./CommentTree";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBlockEnd: theme.spacing(5),
  },
  header: {
    alignItems: "center",
    display: "flex",
  },
  discussionTitle: {
    marginInlineStart: theme.spacing(2),
  },
  discussionContent: {
    marginBlockEnd: theme.spacing(3),
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

export const CREATOR_TEST_ID = "creator";

export default function DiscussionPage({
  discussionId,
}: {
  discussionId: number;
}) {
  const classes = useStyles();
  const router = useRouter();

  const {
    data: discussion,
    error,
    isLoading: isDiscussionLoading,
  } = useQuery<Discussion.AsObject, GrpcError>({
    queryKey: discussionKey(discussionId),
    queryFn: () => service.discussions.getDiscussion(discussionId),
  });

  const { data: discussionCreator, isLoading: isCreatorLoading } = useUser(
    discussion?.creatorUserId
  );

  return (
    <>
      <HtmlMeta title={discussion?.title} />
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ? (
        <CircularProgress />
      ) : (
        discussion && (
          <CommunityBase communityId={discussion.ownerCommunityId}>
            {({ community }) => (
              <>
                {community.mainPage && (
                  <PageHeader
                    page={community.mainPage}
                    className={classes.header}
                  />
                )}
                <CommunityPageSubHeader
                  community={community}
                  tab="discussions"
                />
                <div className={classes.root}>
                  <div className={classes.header}>
                    <HeaderButton
                      onClick={() => router.back()}
                      aria-label={PREVIOUS_PAGE}
                    >
                      <BackIcon />
                    </HeaderButton>
                    <PageTitle className={classes.discussionTitle}>
                      {discussion.title}
                    </PageTitle>
                  </div>
                  <Markdown
                    className={classes.discussionContent}
                    source={discussion.content}
                  />
                  <div
                    className={classes.creatorContainer}
                    data-testid={CREATOR_TEST_ID}
                  >
                    <Avatar
                      user={discussionCreator}
                      className={classes.avatar}
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
                          {dateFormatter.format(
                            timestamp2Date(discussion.created!)
                          )}
                        </Typography>
                      )}
                    </div>
                  </div>
                  <Typography variant="h2">{COMMENTS}</Typography>
                  <CommentTree threadId={discussion.thread!.threadId} />
                </div>
              </>
            )}
          </CommunityBase>
        )
      )}
    </>
  );
}
