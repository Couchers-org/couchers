// import { Typography } from "@material-ui/core";
// import { Skeleton } from "@material-ui/lab";
// import Alert from "components/Alert";
// import CircularProgress from "components/CircularProgress";
// import Divider from "components/Divider";
// import HeaderButton from "components/HeaderButton";
// import { BackIcon } from "components/Icons";
// import PageTitle from "components/PageTitle";
// import UserSummary from "components/UserSummary";
// import { useAuthContext } from "features/auth/AuthProvider";
// import { useGroupChatViewStyles } from "features/messages/groupchats/GroupChatView";
// import InfiniteMessageLoader from "features/messages/messagelist/InfiniteMessageLoader";
// import MessageList from "features/messages/messagelist/MessageList";
// import HostRequestSendField from "features/messages/requests/HostRequestSendField";
// import useMarkLastSeen, {
//   MarkLastSeenVariables,
// } from "features/messages/useMarkLastSeen";
// import {
//   hostRequestKey,
//   hostRequestMessagesKey,
//   hostRequestsListKey,
// } from "features/queryKeys";
// import { useUser } from "features/userQueries/useUsers";
// import { Empty } from "google-protobuf/google/protobuf/empty_pb";
// import { RpcError } from "grpc-web";
// import { useTranslation } from "i18n";
// import { MESSAGES } from "i18n/namespaces";
// import { useRouter } from "next/router";
// import {
//   GetHostRequestMessagesRes,
//   HostRequest,
//   RespondHostRequestReq,
// } from "proto/requests_pb";
// import {
//   useInfiniteQuery,
//   useMutation,
//   useQuery,
//   useQueryClient,
// } from "react-query";
// import { service } from "service";
// import { numNights } from "utils/date";
// import dayjs from "utils/dayjs";
// import { firstName } from "utils/names";

import { ThemedText } from "@/components/ThemedText";

// import { requestStatusToTransKey } from "../constants";

export default function HostRequestView({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  return <ThemedText>Host Request View {hostRequestId}</ThemedText>;
  // const { t } = useTranslation(MESSAGES);
  // const classes = useGroupChatViewStyles();

  // const { data: hostRequest, error: hostRequestError } = useQuery<
  //   HostRequest.AsObject,
  //   RpcError
  // >(
  //   hostRequestKey(hostRequestId),
  //   () => service.requests.getHostRequest(hostRequestId),
  //   {
  //     enabled: !!hostRequestId,
  //   }
  // );

  // const {
  //   data: messagesRes,
  //   isLoading: isMessagesLoading,
  //   error: messagesError,
  //   fetchNextPage,
  //   isFetchingNextPage,
  //   hasNextPage,
  // } = useInfiniteQuery<GetHostRequestMessagesRes.AsObject, RpcError>(
  //   hostRequestMessagesKey(hostRequestId),
  //   ({ pageParam: lastMessageId }) =>
  //     service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
  //   {
  //     enabled: !!hostRequestId,
  //     getNextPageParam: (lastPage) =>
  //       lastPage.noMore ? undefined : lastPage.lastMessageId,
  //   }
  // );

  // const { data: surfer } = useUser(hostRequest?.surferUserId);
  // const { data: host } = useUser(hostRequest?.hostUserId);
  // const currentUserId = useAuthContext().authState.userId;
  // const isHost = host?.userId === currentUserId;
  // const otherUser = isHost ? surfer : host;
  // const title =
  //   otherUser && hostRequest
  //     ? isHost
  //       ? t("host_request_view.title_for_host", {
  //           user: firstName(otherUser.name),
  //           status: t(requestStatusToTransKey[hostRequest.status]),
  //         })
  //       : t("host_request_view.title_for_surfer", {
  //           user: firstName(otherUser.name),
  //           status: t(requestStatusToTransKey[hostRequest.status]),
  //         })
  //     : undefined;

  // const queryClient = useQueryClient();
  // const sendMutation = useMutation<string | undefined, RpcError, string>(
  //   (text: string) =>
  //     service.requests.sendHostRequestMessage(hostRequestId, text),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
  //       queryClient.invalidateQueries(hostRequestsListKey());
  //     },
  //   }
  // );
  // const respondMutation = useMutation<
  //   void,
  //   RpcError,
  //   Required<RespondHostRequestReq.AsObject>
  // >(
  //   (req) =>
  //     service.requests.respondHostRequest(
  //       req.hostRequestId,
  //       req.status,
  //       req.text
  //     ),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(
  //         hostRequestKey(hostRequest?.hostRequestId)
  //       );
  //       queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
  //       queryClient.invalidateQueries(hostRequestsListKey());
  //     },
  //   }
  // );

  // const { mutate: markLastRequestSeen } = useMutation<
  //   Empty,
  //   RpcError,
  //   MarkLastSeenVariables
  // >(
  //   (messageId) =>
  //     service.requests.markLastRequestSeen(hostRequestId, messageId),
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(hostRequestKey(hostRequestId));
  //     },
  //   }
  // );
  // const { markLastSeen } = useMarkLastSeen(
  //   markLastRequestSeen,
  //   hostRequest?.lastSeenMessageId
  // );

  // const router = useRouter();

  // const handleBack = () => router.back();

  // return !hostRequestId ? (
  //   <Alert severity="error">{t("host_request_view.error_message")}</Alert>
  // ) : (
  //   <div className={classes.pageWrapper}>
  //     <div className={classes.header}>
  //       <HeaderButton
  //         onClick={handleBack}
  //         aria-label={t("host_request_view.back_button_a11y_label")}
  //       >
  //         <BackIcon />
  //       </HeaderButton>

  //       <PageTitle className={classes.title}>
  //         {!title || hostRequestError ? <Skeleton width="100" /> : title}
  //       </PageTitle>
  //     </div>
  //     <UserSummary user={otherUser}>
  //       {hostRequest && (
  //         <div className={classes.requestedDatesWrapper}>
  //           <Typography
  //             component="p"
  //             variant="h3"
  //             className={classes.requestedDates}
  //           >
  //             {`${dayjs(hostRequest.fromDate).format("LL")} - ${dayjs(
  //               hostRequest.toDate
  //             ).format("LL")}`}
  //           </Typography>
  //           <Typography
  //             component="p"
  //             variant="h3"
  //             className={classes.numNights}
  //           >
  //             (
  //             {t("host_request_view.request_duration", {
  //               count: numNights(hostRequest.toDate, hostRequest.fromDate),
  //             })}
  //             )
  //           </Typography>
  //         </div>
  //       )}
  //     </UserSummary>
  //     <Divider />
  //     {(respondMutation.error || sendMutation.error || hostRequestError) && (
  //       <Alert severity={"error"}>
  //         {respondMutation.error?.message ||
  //           sendMutation.error?.message ||
  //           hostRequestError?.message ||
  //           ""}
  //       </Alert>
  //     )}
  //     {isMessagesLoading ? (
  //       <CircularProgress />
  //     ) : (
  //       <>
  //         {messagesError && (
  //           <Alert severity="error">{messagesError.message}</Alert>
  //         )}
  //         {messagesRes && hostRequest && (
  //           <>
  //             <InfiniteMessageLoader
  //               earliestMessageId={
  //                 messagesRes.pages[messagesRes.pages.length - 1].lastMessageId
  //               }
  //               fetchNextPage={fetchNextPage}
  //               isFetchingNextPage={isFetchingNextPage}
  //               hasNextPage={!!hasNextPage}
  //               isError={!!messagesError}
  //             >
  //               <MessageList
  //                 markLastSeen={markLastSeen}
  //                 messages={messagesRes.pages
  //                   .map((page) => page.messagesList)
  //                   .flat()}
  //               />
  //             </InfiniteMessageLoader>
  //             <div className={classes.footer}>
  //               <HostRequestSendField
  //                 hostRequest={hostRequest}
  //                 sendMutation={sendMutation}
  //                 respondMutation={respondMutation}
  //               />
  //             </div>
  //           </>
  //         )}
  //       </>
  //     )}
  //   </div>
  // );
}
