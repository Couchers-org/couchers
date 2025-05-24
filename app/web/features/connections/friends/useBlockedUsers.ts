import { blockedUsernamesKey, liteUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetLiteUsersRes } from "proto/api_pb";
import { GetBlockedUsersRes } from "proto/blocking_pb";
import { useQuery } from "react-query";
import { service } from "service";

const useBlockedUsers = () => {
  const errors: string[] = [];

  const {
    data,
    error: blockedUsernamesError,
    isLoading,
  } = useQuery<GetBlockedUsersRes.AsObject, RpcError>(
    blockedUsernamesKey,
    service.blocking.getBlockedUsers,
  );

  const {
    data: blockedUsersData,
    isLoading: isBlockedUsersLoading,
    isError: isBlockedUsersError,
    error: blockedUsersError,
  } = useQuery<GetLiteUsersRes.AsObject, RpcError>({
    queryKey: liteUsersKey(data?.blockedUsernamesList || []),
    queryFn: () => {
      const result = service.user.getLiteUsers(
        data?.blockedUsernamesList || [],
      );
      return result;
    },
    enabled: (data?.blockedUsernamesList?.length ?? 0) > 0, // run only if there are valid userIds
  });

  if (blockedUsernamesError) {
    errors.push(blockedUsernamesError.message);
  }

  if (blockedUsersError) {
    errors.push(blockedUsersError.message);
  }
  const error = errors.length > 0 ? errors.join(", ") : null;
  const isError = !!blockedUsernamesError || isBlockedUsersError;

  return {
    blockedUsers: blockedUsersData?.responsesList || [],
    isLoading: isLoading || isBlockedUsersLoading,
    error,
    isError,
  };
};

export { useBlockedUsers };
