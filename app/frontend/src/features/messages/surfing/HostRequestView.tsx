import { Box, Menu, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import { Error as GrpcError } from "grpc-web";
import * as React from "react";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import Divider from "../../../components/Divider";
import HeaderButton from "../../../components/HeaderButton";
import { BackIcon, OverflowMenuIcon } from "../../../components/Icons";
import PageTitle from "../../../components/PageTitle";
import UserSummary from "../../../components/UserSummary";
import { Message } from "../../../pb/conversations_pb";
import { HostRequest, RespondHostRequestReq } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { firstName } from "../../../utils/names";
import { useAuthContext } from "../../auth/AuthProvider";
import { useUser } from "../../userQueries/useUsers";
import MessageList from "../messagelist/MessageList";
import HostRequestSendField from "./HostRequestSendField";

const useStyles = makeStyles((theme) => ({
  root: {},
  header: { display: "flex", alignItems: "center" },
  title: {
    flexGrow: 1,
    marginInline: theme.spacing(2),
  },
}));

export default function HostRequestView() {
  const classes = useStyles();

  const menuAnchor = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    setMenuOpen(true);
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

  const hostRequestId = +(
    useParams<{ hostRequestId?: string }>().hostRequestId || 0
  );

  const { data: hostRequest, error: hostRequestError } = useQuery<
    HostRequest.AsObject,
    GrpcError
  >(
    ["hostRequest", hostRequestId],
    () => service.requests.getHostRequest(hostRequestId),
    {
      enabled: !!hostRequestId,
    }
  );

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery<Message.AsObject[], GrpcError>(
    ["hostRequestMessages", hostRequestId],
    () => service.requests.getHostRequestMessages(hostRequestId),
    { enabled: !!hostRequestId }
  );

  const { data: surfer } = useUser(hostRequest?.fromUserId);
  const { data: host } = useUser(hostRequest?.toUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = host?.userId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const title = otherUser
    ? isHost
      ? `Request from ${firstName(otherUser.name)}`
      : `Request to ${firstName(otherUser.name)}`
    : undefined;

  const queryClient = useQueryClient();
  const sendMutation = useMutation<string | undefined, GrpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["hostRequestMessages", hostRequestId]);
        queryClient.invalidateQueries(["hostRequests"]);
      },
    }
  );
  const respondMutation = useMutation<
    void,
    GrpcError,
    Required<RespondHostRequestReq.AsObject>
  >(
    (req) =>
      service.requests.respondHostRequest(
        req.hostRequestId,
        req.status,
        req.text
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          "hostRequest",
          hostRequest?.hostRequestId,
        ]);
        queryClient.invalidateQueries(["hostRequestMessages", hostRequestId]);
        queryClient.invalidateQueries(["hostRequests"]);
      },
    }
  );

  const history = useHistory();

  const handleBack = () => history.goBack();

  return !hostRequestId ? (
    <Alert severity={"error"}>Invalid host request id.</Alert>
  ) : (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <HeaderButton onClick={handleBack} aria-label="Back">
          <BackIcon />
        </HeaderButton>

        <PageTitle className={classes.title}>
          {!title || hostRequestError ? <Skeleton width="100" /> : title}
        </PageTitle>

        <HeaderButton
          onClick={handleClick}
          aria-label="Menu"
          aria-haspopup="true"
          aria-controls="more-menu"
          innerRef={menuAnchor}
        >
          <OverflowMenuIcon />
        </HeaderButton>
        <Menu
          id="more-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={menuOpen}
          onClose={handleClose}
        >
          <MenuItem onClick={() => null}>Placeholder</MenuItem>
        </Menu>
      </Box>

      <UserSummary user={otherUser} />

      <Divider />

      {(respondMutation.error || sendMutation.error || hostRequestError) && (
        <Alert severity={"error"}>
          {respondMutation.error?.message ||
            sendMutation.error?.message ||
            hostRequestError?.message}
        </Alert>
      )}
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        <>
          {messagesError && (
            <Alert severity={"error"}>{messagesError.message}</Alert>
          )}
          {messages && hostRequest && (
            <>
              <MessageList messages={messages} />
              <HostRequestSendField
                hostRequest={hostRequest}
                sendMutation={sendMutation}
                respondMutation={respondMutation}
              />
            </>
          )}
        </>
      )}
    </Box>
  );
}
