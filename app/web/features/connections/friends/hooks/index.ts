import { LiteUser, User } from "@couchers/services/api";
import { BlockedUser, GetBlockedUsersRes } from "@couchers/services/blocking";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";

import {
  BLOCKED_USERS_KEY,
  FRIEND_IDS_KEY,
  userKey,
} from "@/features/queryKeys";
import { Sentry } from "@/platform/sentry";
import { service } from "@/service";

const useUnblockUser = () => {
  const queryClient = useQueryClient();

  const { mutate: unblockUserMutation, isPending: isUnblocking } = useMutation<
    Empty,
    Error,
    { username: string },
    { previousBlockedUsers?: BlockedUser.AsObject[] }
  >({
    mutationFn: ({ username }) => service.blocking.unblockUser({ username }),
    onMutate: async ({ username }) => {
      await queryClient.cancelQueries({ queryKey: [BLOCKED_USERS_KEY] });
      queryClient.removeQueries({ queryKey: ["liteUsers"] });

      const previousBlockedUsers =
        queryClient.getQueryData<GetBlockedUsersRes.AsObject>([
          BLOCKED_USERS_KEY,
        ])?.blockedUsersList || [];

      const updatedBlockedUsers = previousBlockedUsers.filter(
        (user) => user.username !== username,
      );

      queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
        [BLOCKED_USERS_KEY],
        {
          blockedUsersList: updatedBlockedUsers,
        },
      );

      return { previousBlockedUsers };
    },
    onError: (
      error,
      user,
      context: { previousBlockedUsers?: BlockedUser.AsObject[] } | undefined,
    ) => {
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
          [BLOCKED_USERS_KEY],
          {
            blockedUsersList: context.previousBlockedUsers,
          },
        );
      }
      Sentry.captureException(error, {
        tags: {
          component: "useUnblockUser",
          action: "unblockUserMutation",
          username: user.username,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [FRIEND_IDS_KEY] });
    },
  });

  return { unblockUserMutation, isUnblocking };
};

const useBlockUser = () => {
  const queryClient = useQueryClient();

  const {
    error,
    isPending,
    mutate: blockUserMutation,
  } = useMutation<
    Empty,
    RpcError,
    LiteUser.AsObject | User.AsObject,
    { previousBlockedUsers?: BlockedUser.AsObject[] }
  >({
    mutationFn: ({ username }) =>
      service.blocking.blockUser({
        username,
      }),
    onMutate: async ({ avatarThumbnailUrl, name, username, userId }) => {
      await queryClient.cancelQueries({ queryKey: [BLOCKED_USERS_KEY] });
      await queryClient.cancelQueries({ queryKey: [FRIEND_IDS_KEY] });
      queryClient.removeQueries({ queryKey: ["liteUsers"] });

      const currentBlockedUsers =
        queryClient.getQueryData<GetBlockedUsersRes.AsObject>([
          BLOCKED_USERS_KEY,
        ])?.blockedUsersList || [];

      const updatedBlockedUsers = [
        {
          userId,
          username,
          name,
          avatarThumbnailUrl,
        },
        ...currentBlockedUsers,
      ];

      queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
        [BLOCKED_USERS_KEY],
        {
          blockedUsersList: updatedBlockedUsers,
        },
      );

      const previousFriendIds =
        queryClient.getQueryData<number[]>([FRIEND_IDS_KEY]) || [];

      const updatedFriendIds = previousFriendIds.filter((id) => id !== userId);

      queryClient.setQueryData([FRIEND_IDS_KEY], updatedFriendIds);

      return { previousBlockedUsers: currentBlockedUsers };
    },
    onSuccess: (_res, { userId }) => {
      if (userId) {
        queryClient.removeQueries({ queryKey: userKey(userId) });
      }
    },
    onError: (
      _err,
      user,
      context: { previousBlockedUsers?: BlockedUser.AsObject[] } | undefined,
    ) => {
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
          [BLOCKED_USERS_KEY],
          {
            blockedUsersList: context.previousBlockedUsers,
          },
        );
      }

      Sentry.captureException(error, {
        tags: {
          component: "useBlockUser",
          action: "blockUserMutation",
          username: user.username,
        },
      });
    },
  });

  return {
    error,
    isPending,
    blockUserMutation,
  };
};

const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  const { mutate: removeFriendMutation, isPending } = useMutation<
    Empty,
    Error,
    { friendId: number; onError: (error: Error | null) => void },
    { previousFriendIds?: number[]; onError: (error: Error | null) => void }
  >({
    mutationFn: ({ friendId }) => service.api.removeFriend(friendId),
    onMutate: async ({ friendId, onError }) => {
      onError(null);
      await queryClient.cancelQueries({ queryKey: [FRIEND_IDS_KEY] });

      const previousFriendIds = queryClient.getQueryData<number[]>([
        FRIEND_IDS_KEY,
      ]);
      const newFriendIds = previousFriendIds?.filter((id) => id !== friendId);

      if (newFriendIds) {
        queryClient.setQueryData<number[]>([FRIEND_IDS_KEY], newFriendIds);
      }

      return { previousFriendIds, onError };
    },
    onError: (err, _, context) => {
      context?.onError(err);

      if (context?.previousFriendIds) {
        queryClient.setQueryData([FRIEND_IDS_KEY], context.previousFriendIds);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [FRIEND_IDS_KEY] });
    },
  });

  return { removeFriendMutation, isPending };
};

export { useBlockUser, useRemoveFriend, useUnblockUser };
