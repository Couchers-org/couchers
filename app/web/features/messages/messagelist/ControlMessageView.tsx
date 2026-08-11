import { Skeleton, styled } from "@mui/material";
import RelativeTime from "components/RelativeTime";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import React from "react";
import { theme } from "theme";

import { firstName } from "../../../utils/names";
import useOnVisibleEffect from "../../../utils/useOnVisibleEffect";
import { controlMessage, messageTargetId } from "../utils";
import { messageElementId, MessageProps } from "./MessageView";

const StyledWrapper = styled("div")(() => ({
  marginInlineEnd: "auto",
  marginInlineStart: "auto",
  textAlign: "center",
}));

const StyledRelativeTime = styled(RelativeTime)(() => ({
  ...theme.typography.caption,
  fontSize: "0.75rem", // 12px
  display: "block",
}));

const StyledBodyWrapper = styled("div")(() => ({
  paddingInlineEnd: theme.spacing(1),
}));

const StyledSkeleton = styled(Skeleton)(() => ({
  minWidth: 100,
}));

export default function ControlMessageView({ message, onVisible, className }: MessageProps) {
  const { t } = useTranslation(MESSAGES);
  const { authState } = useAuthContext();
  const { data: author, isLoading: isAuthorLoading } = useLiteUser(message.authorUserId);
  const { data: target, isLoading: isTargetLoading } = useLiteUser(messageTargetId(message));
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
      <StyledRelativeTime instant={message.time!} capitalize={true} />

      <StyledBodyWrapper>
        {!isAuthorLoading && !isTargetLoading ? (
          <TextBody>
            {controlMessage({
              message,
              user: authorName,
              target_user: targetName,
              t,
              isCurrentUser: message.authorUserId === authState.userId,
            })}
          </TextBody>
        ) : (
          <StyledSkeleton />
        )}
      </StyledBodyWrapper>
    </StyledWrapper>
  );
}
