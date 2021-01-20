import { Box, Menu, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import { Message } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { service } from "../../../service";
import { useUser } from "../../userQueries/useUsers";
import MessageList from "../messagelist/MessageList";
import { Error as GrpcError } from "grpc-web";
import { useAuthContext } from "../../auth/AuthProvider";
import SendField from "../SendField";
import { useHistory, useParams } from "react-router-dom";
import { firstName } from "../../../utils/names";
import { useRef, useState } from "react";
import HeaderButton from "../../../components/HeaderButton";
import { BackIcon, SettingsIcon } from "../../../components/Icons";
import PageTitle from "../../../components/PageTitle";

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
  const surferName = currentUserId === surfer?.userId ? "You" : surfer?.name;
  const hostName = currentUserId === host?.userId ? "you" : host?.name;
  const title =
    surferName && hostName
      ? `${firstName(surferName)} requested to be hosted by ${firstName(
          hostName
        )}`
      : undefined;

  const queryClient = useQueryClient();
  const mutation = useMutation<string | undefined, GrpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    {
      onSuccess: () => {
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
          innerRef={menuAnchor}
        >
          <SettingsIcon />
        </HeaderButton>
        <Menu
          id="simple-menu"
          anchorEl={menuAnchor.current}
          keepMounted
          open={menuOpen}
          onClose={handleClose}
        >
          <MenuItem onClick={() => null}>Placeholder</MenuItem>
        </Menu>
      </Box>

      {(mutation.error || hostRequestError) && (
        <Alert severity={"error"}>
          {mutation.error?.message || hostRequestError?.message}
        </Alert>
      )}
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        <>
          {messagesError && (
            <Alert severity={"error"}>{messagesError.message}</Alert>
          )}
          {messages && (
            <>
              <MessageList messages={messages} />
              <SendField sendMutation={mutation} />
            </>
          )}
        </>
      )}
    </Box>
  );
}
