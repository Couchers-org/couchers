import { People } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { blockedUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { BlockedUser, GetBlockedUsersRes } from "proto/blocking_pb";
import { useState } from "react";
import { service } from "service";

import ConnectionActionDialog from "./ConnectionActionDialog";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import { useUnblockUser } from "./hooks";

function BlockedUsersList({ refetchFriends }: { refetchFriends: () => void }) {
  const { t } = useTranslation([CONNECTIONS]);

  const [userToUnblock, setUserToUnblock] = useState<BlockedUser.AsObject | null>(null);

  const { data, error, isPending } = useQuery<GetBlockedUsersRes.AsObject, RpcError>({
    queryKey: [blockedUsersKey],
    queryFn: service.blocking.getBlockedUsers,
  });

  const { unblockUserMutation, isUnblocking } = useUnblockUser();

  const handleDialogClose = () => {
    setUserToUnblock(null);
  };

  const handleUnblockUserConfirm = ({ username }: { username: string }) => {
    unblockUserMutation({ username });
    refetchFriends();
    handleDialogClose();
  };

  return (
    <>
      <FriendTile
        title={t("connections:blocked_list_title")}
        errorMessage={error?.message || null}
        isLoading={isPending}
        hasData={!!data?.blockedUsersList.length}
        noDataMessage={t("connections:no_blocked_users")}
      >
        {data?.blockedUsersList.map((user: BlockedUser.AsObject) => (
          <FriendSummaryView
            key={user.username}
            friend={user}
            isProfileLink={false}
            menuItems={[
              {
                icon: People,
                label: t("connections:unblock_user"),
                onClick: () => setUserToUnblock(user),
                id: "unblock-user",
              },
            ]}
          />
        ))}
      </FriendTile>
      {userToUnblock && (
        <ConnectionActionDialog
          isOpen
          onClose={handleDialogClose}
          dialogConfirm={t("connections:unblock_user_confirmation_dialog.confirm")}
          dialogId="unblock-user--confirmation-dialog"
          dialogMessage={t("connections:unblock_user_confirmation_dialog.message")}
          dialogTitle={t("connections:unblock_user_confirmation_dialog.title", {
            name: userToUnblock.name,
          })}
          isLoading={isUnblocking}
          onConfirm={() => handleUnblockUserConfirm({ username: userToUnblock.username })}
        />
      )}
    </>
  );
}

export default BlockedUsersList;
