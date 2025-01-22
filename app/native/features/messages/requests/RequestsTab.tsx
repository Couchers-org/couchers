import { hostRequestsListKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { MESSAGES } from "@/i18n/namespaces";
import { GroupChat } from "@/proto/conversations_pb";
import { HostRequest, ListHostRequestsRes } from "@/proto/requests_pb";
import { service } from "@/service";
import { RpcError } from "grpc-web";
import { useInfiniteQuery } from "react-query";
import { StyleSheet } from "react-native";
import CircularProgress from "@/components/CircularProgress";
import Alert from "@/components/Alert";
import TextBody from "@/components/TextBody";
import React from "react";
import { Link, router } from "expo-router";
import { routeToHostRequest } from "@/routes";
import Button from "@/components/Button";
import { FlatList, View } from "react-native";
import HostRequestListItem from "./HostRequestListItem";

const styles = StyleSheet.create({
  root: {
    height: "100%",
  },
  list: {
    height: "100%",
  },
});

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

  const renderItem = ({
    item: hostRequest,
  }: {
    item: HostRequest.AsObject;
  }) => (
    <View style={{ marginBottom: 20, paddingLeft: 5, paddingRight: 5, width: '100%' }}>
      <Link
        href={routeToHostRequest(hostRequest.hostRequestId) as any}
        key={hostRequest.hostRequestId}
      >
        <HostRequestListItem hostRequest={hostRequest} />
      </Link>
    </View>
  );

  return (
    <View style={styles.root}>
      {error && <Alert>{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <FlatList
          style={styles.list}
          data={data?.pages.flatMap((page) => page.hostRequestsList) || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.hostRequestId.toString()}
          ListEmptyComponent={
            <TextBody>{t("requests_tab.no_requests_message")}</TextBody>
          }
          onEndReached={hasNextPage ? loadMoreRequests : undefined}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isFetchingNextPage ? (
              <CircularProgress />
            ) : hasNextPage ? (
              <Button
                onPress={loadMoreRequests}
                loading={isFetchingNextPage}
                title={t("requests_tab.load_more_button_label")}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}
