import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import CommentBox from "components/Comments/CommentBox";
import Markdown from "components/Markdown";
import { Error as GrpcError } from "grpc-web";
import { Discussion } from "pb/discussions_pb";
import { discussionKey } from "queryKeys";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { service } from "service";

export default function DiscussionPage() {
  const { discussionId } = useParams<{
    discussionId: string;
    discussionSlug?: string;
  }>();

  const { data: discussion, error, isLoading } = useQuery<
    Discussion.AsObject,
    GrpcError
  >({
    queryKey: discussionKey(+discussionId),
    queryFn: () => service.discussions.getDiscussion(+discussionId),
  });

  return (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        discussion && (
          <>
            <Typography variant="h1">{discussion.title}</Typography>
            <p>
              Owner:{" "}
              {discussion.ownerCommunityId !== 0
                ? "community " + discussion.ownerGroupId
                : "group " + discussion.ownerGroupId}
            </p>
            <p>
              Created at {discussion.created?.seconds} by{" "}
              {discussion.creatorUserId}
            </p>
            <Markdown source={discussion.content} />
            <CommentBox threadId={discussion.threadId} />
          </>
        )
      )}
    </>
  );
}
