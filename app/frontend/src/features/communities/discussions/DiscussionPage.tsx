import { Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Avatar from "components/Avatar";
import CircularProgress from "components/CircularProgress";
import Divider from "components/Divider";
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

import { ADDED_BY, UNKNOWN_USER } from "../constants";
import RepliesTree from "./RepliesTree";

const useStyles = makeStyles((theme) => ({
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
    marginBlockEnd: theme.spacing(2),
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

  const { data: discussionCreator } = useUser(discussion?.creatorUserId);

  return (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isDiscussionLoading ? (
        <CircularProgress />
      ) : (
        discussion && (
          <>
            <div className={classes.header}>
              <HeaderButton onClick={() => history.goBack()} aria-label="Back">
                <BackIcon />
              </HeaderButton>
              <PageTitle className={classes.discussionTitle}>
                {discussion.title}
              </PageTitle>
            </div>
            <Divider />
            <Markdown source={discussion.content} />
            <Typography variant="body1">{ADDED_BY}</Typography>
            <div className={classes.creatorContainer}>
              <Avatar
                user={discussionCreator}
                className={classes.avatar}
                isProfileLink={false}
              />
              <div className={classes.creatorDetailsContainer}>
                <Typography variant="body1">
                  {discussionCreator?.name ?? UNKNOWN_USER}
                </Typography>
                <Typography variant="body2">
                  Created at{" "}
                  {dateFormatter.format(timestamp2Date(discussion.created!))}
                </Typography>
              </div>
            </div>
            <Divider />
            <RepliesTree discussion={discussion} />
          </>
        )
      )}
    </>
  );
}
