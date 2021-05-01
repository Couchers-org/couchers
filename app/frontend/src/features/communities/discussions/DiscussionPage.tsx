import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { Discussion } from "pb/discussions_pb";
import { discussionKey } from "queryKeys";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { useCommunity, useThread } from "../hooks";
import RepliesTree from "./RepliesTree";

const useStyles = makeStyles((theme) => ({
  title: {
    paddingBottom: 0,
  },
  discussionContent: {
    margin: 0,
  },
}));

export default function DiscussionPage() {
  const classes = useStyles();
  const { discussionId } = useParams<{
    discussionId: string;
    discussionSlug?: string;
  }>();

  const { data: discussion, error, isLoading: isDiscussionLoading } = useQuery<
    Discussion.AsObject,
    GrpcError
  >({
    queryKey: discussionKey(+discussionId),
    queryFn: () => service.discussions.getDiscussion(+discussionId),
  });
  const { data: community, isLoading: isCommunityLoading } = useCommunity(
    discussion?.ownerCommunityId ?? 0,
    {
      enabled: !!discussion,
    }
  );
  const {
    data: discussionThread,
    isLoading: isThreadLoading,
  } = useThread(discussion?.threadId ?? 0, { enabled: !!discussion });

  const userIds = hasAtLeastOnePage(discussionThread, "repliesList")
    ? discussionThread.pages.flatMap((page) =>
        page.repliesList.map((reply) => reply.authorUserId)
      )
    : [];
  const { data: users, isLoading: isUsersLoading } = useUsers(userIds);

  return (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ||
      isCommunityLoading ||
      isThreadLoading ||
      isUsersLoading ? (
        <CircularProgress />
      ) : (
        discussion &&
        discussionThread &&
        users && (
          <>
            <PageTitle className={classes.title}>{discussion.title}</PageTitle>
            <Markdown source={discussion.content} />
            <Typography variant="body1">
              By {users.get(discussion.creatorUserId)?.name} in{" "}
              {community
                ? `${community.name} community`
                : `${discussion.ownerGroupId} group`}
            </Typography>
            <RepliesTree discussionThread={discussionThread} users={users} />
          </>
        )
      )}
    </>
  );
}
