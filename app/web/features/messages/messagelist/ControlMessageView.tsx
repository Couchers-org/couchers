import { Skeleton, styled } from "@mui/material";
import React from "react";

import TextBody from "@/components/TextBody";
import { controlMessage, messageTargetId } from "@/features/messages/utils";
import { useLiteUser } from "@/features/userQueries/useLiteUsers";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { theme } from "@/theme";
import { timestamp2Date } from "@/utils/date";
import { firstName } from "@/utils/names";
import useOnVisibleEffect from "@/utils/useOnVisibleEffect";

import { MessageProps, messageElementId } from "./MessageView";
import TimeInterval from "./TimeInterval";

const StyledWrapper = styled("div")(() => ({
  marginInlineEnd: "auto",
  marginInlineStart: "auto",
  textAlign: "center",
}));

const StyledTimestamp = styled("div")(() => theme.typography.caption);

const StyledBodyWrapper = styled("div")(() => ({
  paddingInlineEnd: theme.spacing(1),
}));

const StyledSkeleton = styled(Skeleton)(() => ({
  minWidth: 100,
}));

const ControlMessageView = ({
  message,
  onVisible,
  className,
}: MessageProps) => {
  const { t } = useTranslation(MESSAGES);
  const { data: author, isLoading: isAuthorLoading } = useLiteUser(
    message.authorUserId,
  );
  const { data: target, isLoading: isTargetLoading } = useLiteUser(
    messageTargetId(message),
  );
  const { ref } = useOnVisibleEffect(onVisible);

  const authorName = firstName(author?.name);
  const targetName = firstName(target?.name);
  return (
    <StyledWrapper
      className={className}
      data-testid={`message-${message.messageId}`}
      ref={ref}
      id={messageElementId(message.messageId)}
    >
      {message.time && (
        <StyledTimestamp>
          <TimeInterval date={timestamp2Date(message.time)} />
        </StyledTimestamp>
      )}

      <StyledBodyWrapper>
        {!isAuthorLoading && !isTargetLoading ? (
          <TextBody>
            {controlMessage({
              message,
              user: authorName,
              targetUser: targetName,
              t,
            })}
          </TextBody>
        ) : (
          <StyledSkeleton />
        )}
      </StyledBodyWrapper>
    </StyledWrapper>
  );
};

export default ControlMessageView;
