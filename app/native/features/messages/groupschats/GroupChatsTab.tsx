import React, { useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { MESSAGES } from '@/i18n/namespaces';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { ListGroupChatsRes } from 'proto/conversations_pb';
import { RpcError } from 'grpc-web';

import Alert from '@/components/Alert';
import Button from '@/components/Button';
import CircularProgress from '@/components/CircularProgress';
import TextBody from '@/components/TextBody';
// import CreateGroupChat from '@/features/messages/groupchats/CreateGroupChat';
// import GroupChatListItem from '@/features/messages/groupchats/GroupChatListItem';
import { groupChatsListKey } from '@/features/queryKeys';
import { service } from '@/service';
import useNotifications from '@/features/useNotifications';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import GroupChatListItem from './GroupChatListItem';
import { routeToGroupChat } from '@/routes';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function GroupChatsTab() {
  const { t } = useTranslation(MESSAGES);
  const { data: notifications } = useNotifications();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  useEffect(() => {
    queryClient.invalidateQueries([groupChatsListKey]);
  }, [unseenMessageCount, queryClient]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListGroupChatsRes.AsObject, RpcError>(
    groupChatsListKey,
    ({ pageParam: lastMessageId }) =>
      service.conversations.listGroupChats(lastMessageId),
    {
      getNextPageParam: (lastPage) =>
        lastPage.noMore ? undefined : lastPage.lastMessageId,
    }
  );

  const loadMoreChats = () => fetchNextPage();

  const renderItem = ({ item: groupChat }: any) => (
    <GroupChatListItem
      groupChat={groupChat}
      onPress={() => {
        router.push(routeToGroupChat(groupChat.groupChatId) as any);
      }}
    />
  );

  const renderFooter = () => (
    hasNextPage && (
      <Button
        onPress={loadMoreChats}
        loading={isFetchingNextPage}
        title={t('group_chats_tab.load_more_button_label')}
      />
    )
  );

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert>{error.message}</Alert>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.pages.flatMap(page => page.groupChatsList) || []}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.groupChatId}
        // ListHeaderComponent={<CreateGroupChat />}
        ListEmptyComponent={
          <TextBody>{t('group_chats_tab.no_chats_message')}</TextBody>
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreChats}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
}
