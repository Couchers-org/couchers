import { List } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import HostRequestListItem from "features/messages/requests/HostRequestListItem";
import useMessageListStyles from "features/messages/useMessageListStyles";
import { hostRequestsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { GroupChat } from "proto/conversations_pb";
import { ListHostRequestsRes } from "proto/requests_pb";
import * as React from "react";
import { useInfiniteQuery } from "react-query";
import { routeToHostRequest } from "routes";
import { service } from "service";

export interface GroupChatListProps {
  groupChats: Array<GroupChat.AsObject>;
}

export default function RequestsTab({
  type,
  onlyActive = false,
}: {
  type: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
}) {
  const { t } = useTranslation(MESSAGES);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>(
    hostRequestsListKey({ onlyActive, type }),
    ({ pageParam: lastRequestId }) =>
      service.requests.listHostRequests({ lastRequestId, onlyActive, type }),
    {
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastRequestId,
    }
  );

  const loadMoreRequests = () => fetchNextPage();

  const classes = useMessageListStyles();
  return (
    <div className={classes.root}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <List className={classes.list}>
          {data &&
            data.pages.map((hostRequestsRes, pageNumber) =>
              pageNumber === 0 &&
              hostRequestsRes.hostRequestsList.length === 0 ? (
                <TextBody key="no-requests-text">
                  {t("requests_tab.no_requests_message")}
                </TextBody>
              ) : (
                <React.Fragment key={`host-requests-page-${pageNumber}`}>
                  {hostRequestsRes.hostRequestsList.map((hostRequest) => (
                    <Link
                      href={routeToHostRequest(hostRequest.hostRequestId)}
                      key={hostRequest.hostRequestId}
                    >
                      <a>
                        <HostRequestListItem
                          hostRequest={hostRequest}
                          className={classes.listItem}
                        />
                      </a>
                    </Link>
                  ))}
                </React.Fragment>
              )
            )}
          {hasNextPage && (
            <Button onClick={loadMoreRequests} loading={isFetchingNextPage}>
              {t("requests_tab.load_more_button_label")}
            </Button>
          )}
        </List>
      )}
    </div>
  );
}
