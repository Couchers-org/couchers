import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockedUsersKey, friendIdsKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import Sentry from "platform/sentry";
import { LiteUser, User } from "proto/api_pb";
import { BlockedUser, GetBlockedUsersRes } from "proto/blocking_pb";
import { service } from "service";

const useUnblockUser = () => {
  const queryClient = useQueryClient();

  const { mutate: unblockUserMutation, isLoading: isUnblocking } = useMutation<
    Empty,
    Error,
    { username: string },
    { previousBlockedUsers?: BlockedUser.AsObject[] }
  >(({ username }) => service.blocking.unblockUser({ username }), {
    onMutate: async ({ username }) => {
      await queryClient.cancelQueries([blockedUsersKey]);
      await queryClient.removeQueries(["liteUsers"]);

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
      queryClient.invalidateQueries([friendIdsKey]);
    },
  });

  return { unblockUserMutation, isUnblocking };
};

const useBlockUser = () => {
  const queryClient = useQueryClient();

  const {
    error,
    isLoading,
    mutate: blockUserMutation,
  } = useMutation<
    Empty,
    RpcError,
    LiteUser.AsObject | User.AsObject,
    { previousBlockedUsers?: BlockedUser.AsObject[] }
  >(
    ({ username }) =>
      service.blocking.blockUser({
        username,
      }),
    {
      onMutate: async ({ avatarThumbnailUrl, name, username, userId }) => {
        await queryClient.cancelQueries([blockedUsersKey]);
        await queryClient.cancelQueries([friendIdsKey]);
        await queryClient.removeQueries(["liteUsers"]);

        const currentBlockedUsers =
          queryClient.getQueryData<GetBlockedUsersRes.AsObject>([
            blockedUsersKey,
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
          [blockedUsersKey],
          {
            blockedUsersList: updatedBlockedUsers,
          },
        );

        const previousFriendIds =
          queryClient.getQueryData<number[]>([friendIdsKey]) || [];

        const updatedFriendIds = previousFriendIds.filter(
          (id) => id !== userId,
        );

        queryClient.setQueryData([friendIdsKey], updatedFriendIds);

        return { previousBlockedUsers: currentBlockedUsers };
      },
      onSuccess: (_res, { userId }) => {
        if (userId) {
          queryClient.removeQueries([userKey(userId)]);
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
    },
  );

  return {
    error,
    isLoading,
    blockUserMutation,
  };
};

const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  const { mutate: removeFriendMutation, isLoading } = useMutation<
    Empty,
    Error,
    { friendId: number; onError: (error: Error | null) => void },
    { previousFriendIds?: number[]; onError: (error: Error | null) => void }
  >(({ friendId }) => service.api.removeFriend(friendId), {
    onMutate: async ({ friendId, onError }) => {
      onError(null);
      await queryClient.cancelQueries([friendIdsKey]);

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
      queryClient.invalidateQueries([friendIdsKey]);
    },
  });

  return { removeFriendMutation, isLoading };
};

export { useBlockUser, useRemoveFriend, useUnblockUser };
