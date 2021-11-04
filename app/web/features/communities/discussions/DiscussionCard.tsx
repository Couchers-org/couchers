import { Card, CardContent, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import { useUser } from "features/userQueries/useUsers";
import { Discussion } from "proto/discussions_pb";
import { useMemo } from "react";
import { routeToDiscussion } from "routes";
import { timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";
import { timeAgo } from "utils/timeAgo";
import Link from "next/link";

import { COMMENTS, getByCreator } from "../constants";
import getContentSummary from "../getContentSummary";

const useStyles = makeStyles((theme) => ({
  avatar: {
    height: "3rem",
    width: "3rem",
  },
  cardContent: {
    display: "flex",
    "&&": {
      padding: theme.spacing(2),
    },
    width: "100%",
  },
  discussionSummary: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    marginInlineStart: theme.spacing(2),
  },
  commentsCount: {
    alignSelf: "flex-end",
    flexShrink: 0,
    color: theme.palette.primary.main,
  },
  userLoading: { display: "inline-block", width: 80 },
  surtitle: { marginBottom: theme.spacing(0.5) },
  replies: {
    "&:first-child": { marginTop: theme.spacing(1) },
  },
  root: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
    width: "100%",
  },
}));

export const DISCUSSION_CARD_TEST_ID = "discussion-card";

export default function DiscussionCard({
  discussion,
  className,
}: {
  discussion: Discussion.AsObject;
  className?: string;
}) {
  const classes = useStyles();
  const { data: creator } = useUser(discussion.creatorUserId);

  const date = discussion.created
    ? timestamp2Date(discussion.created)
    : undefined;
  const postedTime = date ? timeAgo(date) : null;
  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: discussion.content,
        maxLength: 300,
      }),
    [discussion.content]
  );

  return (
    <Card
      className={classNames(classes.root, className)}
      data-testid={DISCUSSION_CARD_TEST_ID}
    >
      <Link href={routeToDiscussion(discussion.discussionId, discussion.slug)}>
        <a>
          <CardContent className={classes.cardContent}>
            <Avatar
              user={creator}
              className={classes.avatar}
              isProfileLink={false}
            />
            <div className={classes.discussionSummary}>
              <Typography
                variant="body2"
                component="p"
                className={classes.surtitle}
              >
                {creator ? (
                  getByCreator(creator.name)
                ) : (
                  <Skeleton className={classes.userLoading} />
                )}{" "}
                {postedTime && `• ${postedTime}`}
              </Typography>
              <Typography variant="h2" component="h3">
                {discussion.title}
              </Typography>
              <Typography variant="body1">{truncatedContent}</Typography>
              <Typography className={classes.commentsCount} variant="body1">
                {`${COMMENTS} | ${discussion.thread?.numResponses}`}
              </Typography>
            </div>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}
