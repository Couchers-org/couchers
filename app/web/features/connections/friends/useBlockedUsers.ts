import { GetBlockedUsersRes } from "proto/blocking_pb";
import { useQuery } from "react-query";
import { service } from "service";

const useBlockedUsers = () => {
  const errors: string[] = [];

  const {
    data,
    error: blockedUsernamesError,
    isLoading,
  } = useQuery<GetBlockedUsersRes.AsObject, Error>(
    "blockedUsernames",
    service.blocking.getBlockedUsers,
  );

  //@TODO add query keys liteUsersKey(uniqueIds) and add string keys to queryKeys file

  const {
    data: blockedUsers,
    isLoading: isBlockedUsersLoading,
    isError: isBlockedUsersError,
    error: blockedUsersError,
  } = useQuery(
    ["blockedUsers", data?.blockedUsernamesList],
    
    async () => {
      if (!data?.blockedUsernamesList) return [];
      const result = service.user.getLiteUsers(data?.blockedUsernamesList);
      return result;
    },
    {
      enabled: !!data?.blockedUsernamesList?.length,
    },
  );

  if (blockedUsernamesError) {
    errors.push(blockedUsernamesError.message);
  }
  if (blockedUsersError) {
    errors.push(blockedUsersError.message);
  }
  const error = errors.length > 0 ? errors.join(", ") : null;
  const isError = !!blockedUsernamesError || isBlockedUsersError;

  if (isError) {
    console.error("Error fetching blocked users:", error);
  }

  return {
    blockedUsers,
    isLoading: isLoading || isBlockedUsersLoading,
    error,
  };
};

export { useBlockedUsers };
