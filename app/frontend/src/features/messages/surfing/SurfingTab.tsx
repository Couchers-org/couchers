import { Box, BoxProps, List } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import * as React from "react";
import { useInfiniteQuery } from "react-query";
import { Link } from "react-router-dom";

import { messagesRoute } from "../../../AppRoutes";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import { GroupChat } from "../../../pb/conversations_pb";
import { ListHostRequestsRes } from "../../../pb/requests_pb";
import { service } from "../../../service";
import useMessageListStyles from "../useMessageListStyles";
import HostRequestListItem from "./HostRequestListItem";

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
    ["hostRequests", { type, onlyActive }],
    ({ pageParam: lastRequestId }) =>
      service.requests.listHostRequests({ lastRequestId, type, onlyActive }),
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
                      to={`${messagesRoute}/request/${hostRequest.hostRequestId}`}
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
