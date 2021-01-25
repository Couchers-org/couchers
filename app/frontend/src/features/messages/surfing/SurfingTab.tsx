import { Box, BoxProps, List } from "@material-ui/core";
import { Error as GrpcError } from "grpc-web";
import * as React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import { messagesRoute } from "../../../AppRoutes";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import { GroupChat } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
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
  const { data: hostRequests, isLoading, error } = useQuery<
    HostRequest.AsObject[],
    GrpcError
  >(["hostRequests", type, onlyActive], () =>
    service.requests.listHostRequests(type, onlyActive)
  );

  const classes = useMessageListStyles();
  return (
    <Box className={classes.root}>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        hostRequests &&
        (!hostRequests.length ? (
          <TextBody>No requests yet.</TextBody>
        ) : (
          <List className={classes.list}>
            {hostRequests.map((hostRequest) => (
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
          </List>
        ))
      )}
    </Box>
  );
}
