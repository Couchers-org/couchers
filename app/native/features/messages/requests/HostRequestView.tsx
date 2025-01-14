import { ThemedText } from "@/components/ThemedText";
import {
  hostRequestKey,
  hostRequestMessagesKey,
  hostRequestsListKey,
} from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import {
  GetHostRequestMessagesRes,
  HostRequest,
  RespondHostRequestReq,
} from "@/proto/requests_pb";
import { service } from "@/service";
import { RpcError } from "grpc-web";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useUser } from "features/userQueries/useUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { firstName } from "@/utils/names";
import { requestStatusToTransKey } from "../constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import useMarkLastSeen, { MarkLastSeenVariables } from "../useMarkLastSeen";
import { useRouter } from "expo-router";
import Alert from "@/components/Alert";
import { View, ScrollView } from "react-native";
import HeaderButton from "@/components/HeaderButton";
import UserSummary from "@/components/UserSummary";
import InfiniteMessageLoader from "@/features/messages/messagelist/InfiniteMessageLoader";
import MessageList from "@/features/messages/messagelist/MessageList";
import HostRequestSendField from "@/features/messages/requests/HostRequestSendField";
import CircularProgress from "@/components/CircularProgress";
import dayjs from "@/utils/dayjs";
import { numNights } from "@/utils/date";
import { Avatar, Divider } from "react-native-paper";

export default function HostRequestView({
  hostRequestId,
}: {
  hostRequestId: number;
}) {
  const { t } = useTranslation(MESSAGES);

  const { data: hostRequest, error: hostRequestError } = useQuery<
    HostRequest.AsObject,
    RpcError
  >(
    hostRequestKey(hostRequestId),
    () => service.requests.getHostRequest(hostRequestId),
    {
      enabled: !!hostRequestId,
    }
  );

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<GetHostRequestMessagesRes.AsObject, RpcError>(
    hostRequestMessagesKey(hostRequestId),
    ({ pageParam: lastMessageId }) =>
      service.requests.getHostRequestMessages(hostRequestId, lastMessageId),
    {
      enabled: !!hostRequestId,
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const { data: surfer } = useUser(hostRequest?.surferUserId);
  const { data: host } = useUser(hostRequest?.hostUserId);
  const currentUserId = useAuthContext().authState.userId;
  const isHost = host?.userId === currentUserId;
  const otherUser = isHost ? surfer : host;
  const title =
    otherUser && hostRequest
      ? isHost
        ? t("host_request_view.title_for_host", {
            user: firstName(otherUser.name),
            status: t(requestStatusToTransKey[hostRequest.status]),
          })
        : t("host_request_view.title_for_surfer", {
            user: firstName(otherUser.name),
            status: t(requestStatusToTransKey[hostRequest.status]),
          })
      : undefined;

  const queryClient = useQueryClient();
  const sendMutation = useMutation<string | undefined, RpcError, string>(
    (text: string) =>
      service.requests.sendHostRequestMessage(hostRequestId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
        queryClient.invalidateQueries(hostRequestsListKey());
      },
    }
  );
  const respondMutation = useMutation<
    void,
    RpcError,
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
        queryClient.invalidateQueries(
          hostRequestKey(hostRequest?.hostRequestId)
        );
        queryClient.invalidateQueries(hostRequestMessagesKey(hostRequestId));
        queryClient.invalidateQueries(hostRequestsListKey());
      },
    }
  );

  const { mutate: markLastRequestSeen } = useMutation<
    Empty,
    RpcError,
    MarkLastSeenVariables
  >(
    (messageId) =>
      service.requests.markLastRequestSeen(hostRequestId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestKey(hostRequestId));
      },
    }
  );
  const { markLastSeen } = useMarkLastSeen(
    markLastRequestSeen,
    hostRequest?.lastSeenMessageId
  );

  const router = useRouter();

  const handleBack = () => router.back();

  if (!hostRequestId) {
    return <Alert>{t("host_request_view.error_message")}</Alert>;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", padding: 10 }}>
        <HeaderButton
          onPress={handleBack}
          accessibilityLabel={t("host_request_view.back_button_a11y_label")}
        >
          <Avatar.Icon icon="chevron-left" size={30} />
        </HeaderButton>

        <ThemedText type="subtitle" style={{ marginLeft: 10, flex: 1 }}>
          {!title || hostRequestError ? (
            <ThemedText>Loading...</ThemedText>
          ) : (
            title
          )}
        </ThemedText>
      </View>
      <UserSummary user={otherUser} smallAvatar={true}>
        {hostRequest && (
          <View style={{ marginTop: 10 }}>
            <ThemedText>
              {`${dayjs(hostRequest.fromDate).format("LL")} - ${dayjs(
                hostRequest.toDate
              ).format("LL")}`}
            </ThemedText>
            <ThemedText>
              (
              {t("host_request_view.request_duration", {
                count: numNights(hostRequest.toDate, hostRequest.fromDate),
              })}
              )
            </ThemedText>
          </View>
        )}
      </UserSummary>
      <Divider />
      {(respondMutation.error || sendMutation.error || hostRequestError) && (
        <Alert>
          {respondMutation.error?.message ||
            sendMutation.error?.message ||
            hostRequestError?.message ||
            ""}
        </Alert>
      )}
      {isMessagesLoading ? (
        <CircularProgress />
      ) : (
        <View style={{ flex: 1 }}>
          {messagesError && <Alert>{messagesError.message}</Alert>}
          {messagesRes && hostRequest && (
            <>
              <InfiniteMessageLoader
                earliestMessageId={
                  messagesRes.pages[messagesRes.pages.length - 1].lastMessageId
                }
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                isError={!!messagesError}
              >
                <MessageList
                  markLastSeen={markLastSeen}
                  messages={messagesRes.pages
                    .map((page) => page.messagesList)
                    .flat()}
                />
              </InfiniteMessageLoader>
              <View style={{ padding: 10 }}>
                <HostRequestSendField
                  hostRequest={hostRequest}
                  sendMutation={sendMutation}
                  respondMutation={respondMutation}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
