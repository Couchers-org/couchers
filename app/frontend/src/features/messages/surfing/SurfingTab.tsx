import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useQuery } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { GroupChat } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { Error as GrpcError } from "grpc-web";
import { Link } from "react-router-dom";
import TextBody from "../../../components/TextBody";
import HostRequestListItem from "./HostRequestListItem";
import { messagesRoute } from "../../../AppRoutes";

const useStyles = makeStyles({ root: {} });

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

  const classes = useStyles();
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
          hostRequests.map((hostRequest) => (
            <Link
              to={`${messagesRoute}/request/${hostRequest.hostRequestId}`}
              key={hostRequest.hostRequestId}
            >
              <HostRequestListItem hostRequest={hostRequest} />
            </Link>
          ))
        ))
      )}
    </Box>
  );
}
