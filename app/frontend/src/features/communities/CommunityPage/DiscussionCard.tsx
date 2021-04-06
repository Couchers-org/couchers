import { Card, CardContent, Typography } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import { useUser } from "features/userQueries/useUsers";
import { Discussion } from "pb/discussions_pb";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { routeToDiscussion } from "routes";
import { timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";
import stripMarkdown from "utils/stripMarkdown";
import { timeAgo } from "utils/timeAgo";

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
    marginInlineStart: theme.spacing(2),
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
  const posted = date ? timeAgo(date, false) : "sometime";
  const truncatedContent = useMemo(() => {
    const strippedText = stripMarkdown(discussion.content.replace("\n", " "));
    return strippedText.length > 300
      ? strippedText.substring(0, 298) + "..."
      : strippedText;
  }, [discussion.content]);

  return (
    <Card className={classNames(classes.root, className)}>
      <Link to={routeToDiscussion(discussion.discussionId, discussion.slug)}>
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
            <Typography variant="h2" component="h3">
              {discussion.title}
            </Typography>
            <Typography variant="body1">{truncatedContent}</Typography>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
