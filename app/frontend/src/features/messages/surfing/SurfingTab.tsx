import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useState } from "react";
import { useQuery } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { GroupChat } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { service } from "../../../service";
import HostRequestList from "./HostRequestList";
import HostRequestView from "./HostRequestView";
import { Error as GrpcError } from "grpc-web";

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
  ///TODO: add url chat opening
  const [hostRequest, setHostRequest] = useState<HostRequest.AsObject | null>(
    null
  );
  const { data: hostRequests, isLoading, error } = useQuery<
    HostRequest.AsObject[],
    GrpcError
  >(["hostRequests", type, onlyActive], () =>
    service.requests.listHostRequests(type, onlyActive)
  );

  const classes = useStyles();
  return (
    <Box className={classes.root}>
      {hostRequest ? (
        <HostRequestView hostRequest={hostRequest} />
      ) : (
        <>
          {error && <Alert severity="error">{error.message}</Alert>}
          {isLoading ? (
            <CircularProgress />
          ) : (
            hostRequests && (
              <HostRequestList
                hostRequests={hostRequests}
                setHostRequest={setHostRequest}
              />
            )
          )}
        </>
      )}
    </Box>
  );
}
