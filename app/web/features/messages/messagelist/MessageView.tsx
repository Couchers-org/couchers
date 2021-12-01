import { Card, CardContent, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import Linkify from "components/Linkify";
import TextBody from "components/TextBody";
import FlagButton from "features/FlagButton";
import TimeInterval from "features/messages/messagelist/TimeInterval";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useUser } from "features/userQueries/useUsers";
import { Message } from "proto/conversations_pb";
import { timestamp2Date } from "utils/date";
import useOnVisibleEffect from "utils/useOnVisibleEffect";

export const messageElementId = (id: number) => `message-${id}`;

const useStyles = makeStyles((theme) => ({
  avatar: { height: 40, width: 40 },
  card: {
    [theme.breakpoints.up("xs")]: {
      width: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      width: "80%",
    },
    [theme.breakpoints.up("md")]: {
      width: "70%",
    },
    border: "1px solid",
    borderRadius: theme.shape.borderRadius * 3,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: theme.spacing(2),
    paddingInlineEnd: theme.spacing(2),
    paddingInlineStart: theme.spacing(2),
  },
  header: {
    alignItems: "center",
    display: "flex",
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  loadingCard: {
    borderColor: theme.palette.text.secondary,
  },
  loadingRoot: { justifyContent: "center" },
  messageBody: {
    "&:last-child": { paddingBottom: theme.spacing(2) },
    paddingBottom: theme.spacing(1),
    paddingTop: 0,
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  name: {
    ...theme.typography.body2,
    flexGrow: 1,
    fontWeight: "bold",
    margin: 0,
  },
  otherCard: {
    borderColor: theme.palette.primary.main,
  },
  otherRoot: { justifyContent: "flex-start" },
  root: {
    "& > :first-child": { marginRight: theme.spacing(2) },
    display: "flex",
  },
  userCard: {
    borderColor: theme.palette.secondary.main,
  },
  userRoot: { justifyContent: "flex-end" },
  leftOfMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

export interface MessageProps {
  message: Message.AsObject;
  onVisible?(): void;
  className?: string;
}

export default function MessageView({
  message,
  onVisible,
  className,
}: MessageProps) {
  const classes = useStyles();
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useCurrentUser();
  const isLoading = isAuthorLoading || isCurrentUserLoading;
  const isCurrentUser = author?.userId === currentUser?.userId;

  const { ref } = useOnVisibleEffect(onVisible);

  return (
    <div
      className={classNames(classes.root, className, {
        [classes.loadingRoot]: isLoading,
        [classes.userRoot]: isCurrentUser && !isLoading,
        [classes.otherRoot]: !isCurrentUser && !isLoading,
      })}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={messageElementId(message.messageId)}
    >
      {author && !isCurrentUser && (
        <div className={classes.leftOfMessage}>
          <Avatar user={author} className={classes.avatar} />
          <FlagButton
            contentRef={`chat/message/${message.messageId}`}
            authorUser={author.userId}
          />
        </div>
      )}
      <Card
        className={classNames(classes.card, {
          [classes.loadingCard]: isLoading,
          [classes.userCard]: isCurrentUser && !isLoading,
          [classes.otherCard]: !isCurrentUser && !isLoading,
        })}
      >
        <div className={classes.header}>
          {author ? (
            <Typography variant="h5" className={classes.name}>
              {author.name}
            </Typography>
          ) : (
            <Skeleton width={100} />
          )}
          {!isCurrentUser && (
            <TimeInterval date={timestamp2Date(message.time!)} />
          )}
        </div>

        <CardContent className={classes.messageBody}>
          <TextBody>
            <Linkify text={message.text?.text || ""} />
          </TextBody>
        </CardContent>

        {isCurrentUser && (
          <div className={classes.footer}>
            <TimeInterval date={timestamp2Date(message.time!)} />
          </div>
        )}
      </Card>
      {author && isCurrentUser && (
        <Avatar user={author} className={classes.avatar} />
      )}
    </div>
  );
}
