import { styled } from "@mui/material";
import { InfiniteData } from "@tanstack/react-query";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import { GetGroupChatMessagesRes } from "proto/conversations_pb";
import { HostRequest } from "proto/requests_pb";
import { ReactNode } from "react";

const StyledInfiniteMessageLoader = styled(InfiniteMessageLoader)(
  ({ theme }) => ({
    padding: theme.spacing(2, 2),

    [theme.breakpoints.down("md")]: {
      padding: theme.spacing(1, 1),
    },
  }),
);

const ChatContent = ({
  isHostRequest,
  isLoading,
  hostRequest,
  messages,
  fetchNextPage,
  isFetchingNextPage,
  hasNextPage,
  markLastSeen,
  isError,
  footer,
  isDm = false,
}: {
  isHostRequest: boolean;
  isLoading: boolean;
  hostRequest?: HostRequest.AsObject | undefined;
  messages: InfiniteData<GetGroupChatMessagesRes.AsObject> | undefined;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  markLastSeen: (messageId: number) => void;
  isError: boolean;
  footer?: ReactNode;
  isDm?: boolean;
}) => {
  if (isLoading) {
    return <CenteredSpinner minHeight="100%" />;
  }

  if (!messages || (isHostRequest && !hostRequest)) {
    return null;
  }

  return (
    <StyledInfiniteMessageLoader
      earliestMessageId={
        messages.pages[messages.pages.length - 1].lastMessageId
      }
      latestMessage={messages.pages[0].messagesList[0]}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
      isError={isError}
    >
      <MessageList
        markLastSeen={markLastSeen}
        messages={messages.pages.map((page) => page.messagesList).flat()}
        isDm={isHostRequest || isDm}
      />
      {footer}
    </StyledInfiniteMessageLoader>
  );
};

export default ChatContent;
