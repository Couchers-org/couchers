import { makeStyles, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import { Error as GrpcError } from "grpc-web";
import React, { useMemo } from "react";
import { useInfiniteQuery } from "react-query";
import { Link } from "react-router-dom";

import { Card, CardActionArea, CardContent } from "../../../components/Card";
import CircularProgress from "../../../components/CircularProgress";
import { Discussion } from "../../../pb/discussions_pb";
import { GetThreadRes } from "../../../pb/threads_pb";
import { threadKey } from "../../../queryKeys";
import { routeToDiscussion } from "../../../routes";
import { service } from "../../../service";
import { timestamp2Date } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import stripMarkdown from "../../../utils/stripMarkdown";
import { timeAgo } from "../../../utils/timeAgo";
import useUsers, { useUser } from "../../userQueries/useUsers";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  cardContent: { height: "100%" },
  link: { textDecoration: "none", height: "100%" },
  userLoading: { display: "inline-block", width: 80 },
  title: {},
  surtitle: { marginBottom: theme.spacing(0.5) },
  replies: {
    "&:first-child": { marginTop: theme.spacing(1) },
  },
}));

export default function DiscussionCard({
  discussion,
  className,
}: {
  discussion: Discussion.AsObject;
  className?: string;
}) {
  const classes = useStyles();
  const { data: creator } = useUser(discussion.creatorUserId);
  //although we are only using 1 page of query, still use infinite as that
  //is how data is stored under that query key
  const { data: thread } = useInfiniteQuery<GetThreadRes.AsObject, GrpcError>(
    threadKey(discussion.threadId),
    () => service.threads.getThread(discussion.threadId),
    {
      enabled: !!creator,
    }
  );
  const replyUserIds =
    (thread?.pages.length ?? 0) > 0
      ? thread!.pages[0].repliesList.map((reply) => reply.authorUserId)
      : [];
  const { data: replyUsers } = useUsers(replyUserIds);

  const date = discussion.created
    ? timestamp2Date(discussion.created)
    : undefined;
  const posted = date ? timeAgo(date, false) : "sometime";
  const strippedText = useMemo(
    () => stripMarkdown(discussion.content.replace("\n", " ")),
    [discussion.content]
  );
  const textTruncated =
    strippedText.length > 300
      ? strippedText.substring(0, 298) + "..."
      : strippedText;

  return (
    <Card className={classNames(classes.root, className)}>
      <Link
        to={routeToDiscussion(discussion.discussionId, discussion.slug)}
        className={classes.link}
        component={CardActionArea}
      >
        <CardContent className={classes.cardContent}>
          <Typography
            variant="caption"
            component="p"
            className={classes.surtitle}
            noWrap
          >
            By{" "}
            {creator ? (
              creator.name
            ) : (
              <Skeleton className={classes.userLoading} />
            )}{" "}
            • {posted}
          </Typography>
          <Typography variant="h2" component="h3" className={classes.title}>
            {discussion.title}
          </Typography>
          <Typography variant="body1">{textTruncated}</Typography>
          <div className={classes.replies}>
            {(thread?.pages.length ?? 0) > 0 ? (
              (thread?.pages[0]?.repliesList.length ?? 0) > 0 && (
                <>
                  {thread?.pages[0].repliesList.slice(0, 3).map((reply) => (
                    <Typography
                      variant="body2"
                      className={classes.replies}
                      key={reply.threadId}
                      noWrap
                    >
                      {replyUsers?.get(reply.authorUserId) ? (
                        firstName(replyUsers.get(reply.authorUserId)?.name)
                      ) : (
                        <Skeleton className={classes.userLoading} />
                      )}
                      : {stripMarkdown(reply.content)}
                    </Typography>
                  ))}
                  {(thread?.pages[0].repliesList.length ?? 0) > 3 && (
                    <Typography variant="body2">More replies...</Typography>
                  )}
                </>
              )
            ) : (
              <CircularProgress />
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
