import { Box, BoxProps, List } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import HostRequestListItem from "features/messages/surfing/HostRequestListItem";
import useMessageListStyles from "features/messages/useMessageListStyles";
import { Error as GrpcError } from "grpc-web";
import { GroupChat } from "pb/conversations_pb";
import { ListHostRequestsRes } from "pb/requests_pb";
import * as React from "react";
import { useInfiniteQuery } from "react-query";
import { Link } from "react-router-dom";
import { routeToHostRequest } from "routes";
import { service } from "service/index";

export interface GroupChatListProps extends BoxProps {
  groupChats: Array<GroupChat.AsObject>;
}

export default function SurfingTab({
  type,
  onlyActive = false,
}: {
  type: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, GrpcError>(
    ["hostRequests", { onlyActive, type }],
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
    <Box className={classes.root}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <List className={classes.list}>
          {data &&
            data.pages.map((hostRequestsRes, pageNumber) =>
              pageNumber === 0 &&
              hostRequestsRes.hostRequestsList.length === 0 ? (
                <TextBody key="no-requests-text">No requests yet.</TextBody>
              ) : (
                <React.Fragment key={`host-requests-page-${pageNumber}`}>
                  {hostRequestsRes.hostRequestsList.map((hostRequest) => (
                    <Link
                      to={routeToHostRequest(hostRequest.hostRequestId)}
                      key={hostRequest.hostRequestId}
                      className={classes.link}
                    >
                      <HostRequestListItem
                        hostRequest={hostRequest}
                        className={classes.listItem}
                      />
                    </Link>
                  ))}
                </React.Fragment>
              )
            )}
          {hasNextPage && (
            <Button onClick={loadMoreRequests} loading={isFetchingNextPage}>
              Load more
            </Button>
          )}
        </List>
      )}
    </Box>
  );
}
