import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import React from "react";

import { timestamp2Date } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import useOnVisibleEffect from "../../../utils/useOnVisibleEffect";
import { useUser } from "../../userQueries/useUsers";
import { controlMessage, messageTargetId } from "../utils";
import { messageElementId, MessageProps } from "./MessageView";
import TimeInterval from "./TimeInterval";

const useStyles = makeStyles((theme) => ({
  message: {
    paddingInlineEnd: theme.spacing(1),
  },
  root: {
    marginInlineEnd: "auto",
    marginInlineStart: "auto",
    textAlign: "center",
  },
  skeleton: { minWidth: 100 },
  timestamp: theme.typography.caption,
}));

export default function ControlMessageView({
  message,
  onVisible,
  className,
}: MessageProps) {
  const { t } = useTranslation(MESSAGES);
  const classes = useStyles();
  const { data: author, isLoading: isAuthorLoading } = useUser(
    message.authorUserId
  );
  const { data: target, isLoading: isTargetLoading } = useUser(
    messageTargetId(message)
  );
  const { ref } = useOnVisibleEffect(onVisible);

  const authorName = firstName(author?.name);
  const targetName = firstName(target?.name);
  return (
    <div
      className={classNames(classes.root, className)}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={messageElementId(message.messageId)}
    >
      <div className={classes.timestamp}>
        <TimeInterval date={timestamp2Date(message.time!)} />
      </div>

      <div className={classes.message}>
        {!isAuthorLoading && !isTargetLoading ? (
          <TextBody>
            {controlMessage({
              message,
              user: authorName,
              target_user: targetName,
              t,
            })}
          </TextBody>
        ) : (
          <Skeleton className={classes.skeleton} />
        )}
      </div>
    </div>
  );
}
