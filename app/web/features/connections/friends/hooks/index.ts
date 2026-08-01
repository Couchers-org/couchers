import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LiteUser, User } from "couchers/proto/api_pb";
import { BlockedUser, GetBlockedUsersRes } from "couchers/proto/blocking_pb";
import { blockedUsersKey, friendIdsKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import Sentry from "platform/sentry";
import { service } from "service";

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
      await queryClient.cancelQueries({ queryKey: [blockedUsersKey] });
      await queryClient.removeQueries({ queryKey: ["liteUsers"] });

      const previousBlockedUsers =
        queryClient.getQueryData<GetBlockedUsersRes.AsObject>([blockedUsersKey])
          ?.blockedUsersList || [];

      const updatedBlockedUsers = previousBlockedUsers.filter(
        (user) => user.username !== username,
      );

      queryClient.setQueryData<GetBlockedUsersRes.AsObject>([blockedUsersKey], {
        blockedUsersList: updatedBlockedUsers,
      });

      return { previousBlockedUsers };
    },
    onError: (
      error,
      user,
      context: { previousBlockedUsers?: BlockedUser.AsObject[] } | undefined,
    ) => {
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
          [blockedUsersKey],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [friendIdsKey] });
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
      await queryClient.cancelQueries({ queryKey: [blockedUsersKey] });
      await queryClient.cancelQueries({ queryKey: [friendIdsKey] });
      await queryClient.removeQueries({ queryKey: ["liteUsers"] });

      const currentBlockedUsers =
        queryClient.getQueryData<GetBlockedUsersRes.AsObject>([blockedUsersKey])
          ?.blockedUsersList || [];

      const updatedBlockedUsers = [
        {
          userId,
          username,
          name,
          avatarThumbnailUrl,
        },
        ...currentBlockedUsers,
      ];

      queryClient.setQueryData<GetBlockedUsersRes.AsObject>([blockedUsersKey], {
        blockedUsersList: updatedBlockedUsers,
      });

      const previousFriendIds =
        queryClient.getQueryData<number[]>([friendIdsKey]) || [];

      const updatedFriendIds = previousFriendIds.filter((id) => id !== userId);

      queryClient.setQueryData([friendIdsKey], updatedFriendIds);

      return { previousBlockedUsers: currentBlockedUsers };
    },
    onSuccess: (_res, { userId }) => {
      if (userId) {
        queryClient.removeQueries({ queryKey: userKey(userId) });
      }
    },
    onError: (
      err,
      user,
      context: { previousBlockedUsers?: BlockedUser.AsObject[] } | undefined,
    ) => {
      if (context?.previousBlockedUsers) {
        queryClient.setQueryData<GetBlockedUsersRes.AsObject>(
          [blockedUsersKey],
          {
            blockedUsersList: context?.previousBlockedUsers,
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
      await queryClient.cancelQueries({ queryKey: [friendIdsKey] });

      const previousFriendIds = queryClient.getQueryData<number[]>([
        friendIdsKey,
      ]);
      const newFriendIds = previousFriendIds?.filter((id) => id !== friendId);

      if (newFriendIds) {
        queryClient.setQueryData<number[]>([friendIdsKey], newFriendIds);
      }

      return { previousFriendIds, onError };
    },
    onError: (err, _, context) => {
      context?.onError(err);

      if (context?.previousFriendIds) {
        queryClient.setQueryData([friendIdsKey], context.previousFriendIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [friendIdsKey] });
    },
  });

  return { removeFriendMutation, isPending };
};

export { useBlockUser, useRemoveFriend, useUnblockUser };
