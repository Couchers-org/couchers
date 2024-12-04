import { styled } from "@mui/material";
import CircularProgress from "components/CircularProgress";
import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "features/messages/messagelist/MessageList";
import { GetGroupChatMessagesRes } from "proto/conversations_pb";
import { HostRequest } from "proto/requests_pb";
import { InfiniteData } from "react-query";

const StyledInfiniteMessageLoader = styled(InfiniteMessageLoader)(
  ({ theme }) => ({
    padding: theme.spacing(2, 2),

    [theme.breakpoints.down("md")]: {
      padding: theme.spacing(1, 1),
    },
  })
);

const StyledSpinnerWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(2),
  width: "100%",
}));

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
}) => {
  if (isLoading) {
    return (
      <StyledSpinnerWrapper>
        <CircularProgress />
      </StyledSpinnerWrapper>
    );
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
      />
    </StyledInfiniteMessageLoader>
  );
};

export default ChatContent;
