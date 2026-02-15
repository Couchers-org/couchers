import { List, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import TextBody from "components/TextBody";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import { groupChatsListKey, hostRequestsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { ListGroupChatsRes } from "proto/conversations_pb";
import { ListHostRequestsRes } from "proto/requests_pb";
import React from "react";
import { routeToGroupChat, routeToHostRequest } from "routes";
import { service } from "service";
import { theme } from "theme";

const StyledWrapper = styled("div")(() => ({
  padding: theme.spacing(0, 2),
}));

const StyledList = styled(List)(() => ({
  width: "100%",
}));

const StyledSection = styled("div")(() => ({
  marginTop: theme.spacing(3),
  "&:first-of-type": {
    marginTop: 0,
  },
}));

const StyledGroupChatListItem = styled(GroupChatListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

const StyledHostRequestListItem = styled(HostRequestListItem)(() => ({
  marginInline: `-${theme.spacing(2)}`,
  paddingInline: `${theme.spacing(2)}`,
}));

export default function ArchivedTab() {
  const { t } = useTranslation(MESSAGES);

  // Fetch archived group chats
  const {
    data: chatsData,
    isLoading: chatsLoading,
    error: chatsError,
    hasNextPage: chatsHasNextPage,
    fetchNextPage: chatsFetchNextPage,
    isFetchingNextPage: chatsIsFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, RpcError>({
    queryKey: [groupChatsListKey({ onlyArchived: true })],
    queryFn: ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(
        lastMessageId as number | undefined,
        10,
        true
      ),
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastMessageId,
    initialPageParam: undefined,
  });

  // Fetch archived host requests (both hosting and surfing)
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    hasNextPage: requestsHasNextPage,
    fetchNextPage: requestsFetchNextPage,
    isFetchingNextPage: requestsIsFetchingNextPage,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({ onlyArchived: true, type: "all" }),
    queryFn: ({ pageParam: lastRequestId }) =>
      service.requests.listHostRequests({
        lastRequestId: lastRequestId as number | undefined,
        type: "all",
        onlyActive: false,
        onlyArchived: true,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.lastRequestId,
    initialPageParam: undefined,
  });

  const isLoading = chatsLoading || requestsLoading;
  const error = chatsError || requestsError;

  const hasNoArchivedItems =
    chatsData?.pages[0]?.groupChatsList.length === 0 &&
    requestsData?.pages[0]?.hostRequestsList.length === 0;

  return (
    <StyledWrapper>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasNoArchivedItems ? (
        <TextBody>{t("archive.no_archived_messages")}</TextBody>
      ) : (
        <>
          {/* Archived Chats Section */}
          {chatsData &&
            chatsData.pages.some((page) => page.groupChatsList.length > 0) && (
              <StyledSection>
                <Typography variant="h3" gutterBottom>
                  {t("messages_page.tabs.chats")}
                </Typography>
                <StyledList>
                  {chatsData.pages.map((groupChatsRes, pageNumber) => (
                    <React.Fragment key={`archived-chats-page-${pageNumber}`}>
                      {groupChatsRes.groupChatsList.map((groupChat) => (
                        <Link
                          key={groupChat.groupChatId}
                          href={routeToGroupChat(groupChat.groupChatId)}
                        >
                          <StyledGroupChatListItem
                            groupChat={groupChat}
                            isArchived
                          />
                        </Link>
                      ))}
                    </React.Fragment>
                  ))}
                  {chatsHasNextPage && (
                    <Button
                      onClick={() => chatsFetchNextPage()}
                      loading={chatsIsFetchingNextPage}
                    >
                      {t("group_chats_tab.load_more_button_label")}
                    </Button>
                  )}
                </StyledList>
              </StyledSection>
            )}

          {/* Archived Host Requests Section */}
          {requestsData &&
            requestsData.pages.some(
              (page) => page.hostRequestsList.length > 0
            ) && (
              <StyledSection>
                <Typography variant="h3" gutterBottom>
                  {t("messages_page.tabs.hosting")} &{" "}
                  {t("messages_page.tabs.surfing")}
                </Typography>
                <StyledList>
                  {requestsData.pages.map((hostRequestsRes, pageNumber) => (
                    <React.Fragment
                      key={`archived-requests-page-${pageNumber}`}
                    >
                      {hostRequestsRes.hostRequestsList.map((hostRequest) => (
                        <Link
                          key={hostRequest.hostRequestId}
                          href={routeToHostRequest(hostRequest.hostRequestId)}
                        >
                          <StyledHostRequestListItem
                            hostRequest={hostRequest}
                            isArchived
                          />
                        </Link>
                      ))}
                    </React.Fragment>
                  ))}
                  {requestsHasNextPage && (
                    <Button
                      onClick={() => requestsFetchNextPage()}
                      loading={requestsIsFetchingNextPage}
                    >
                      {t("requests_tab.load_more_button_label")}
                    </Button>
                  )}
                </StyledList>
              </StyledSection>
            )}
        </>
      )}
    </StyledWrapper>
  );
}
