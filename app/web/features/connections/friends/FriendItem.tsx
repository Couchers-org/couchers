import { Block, PersonRemove } from "@mui/icons-material";
import EllipsisMenu from "components/EllipsisMenu";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useState } from "react";

import ConnectionActionDialog from "./ConnectionActionDialog";
import FriendSummaryView from "./FriendSummaryView";
import { useBlockUser, useRemoveFriend } from "./hooks";

interface FriendItemProps {
  friend: LiteUser.AsObject;
  onError: (error: Error | null) => void;
}

const FriendItem = ({ friend, onError }: FriendItemProps) => {
  const { t } = useTranslation([GLOBAL, CONNECTIONS]);

  const [openDialog, setOpenDialog] = useState<"remove-friend" | "block-user" | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null);

  const isMenuOpen = Boolean(menuAnchorEl);

  const { blockUserMutation, isPending: isBlocking } = useBlockUser();

  const { removeFriendMutation, isPending: isRemoving } = useRemoveFriend();

  const removeFriend = (userId: number) => {
    if (userId !== undefined) {
      removeFriendMutation({ friendId: userId, onError });
      handleDialogClose();
    }
  };

  const handleBlockUser = () => {
    setOpenDialog("block-user");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setMenuAnchorEl(null);
  };

  const handleRemoveFriend = () => {
    setOpenDialog("remove-friend");
  };

  const handleDialogClose = () => {
    setOpenDialog(null);
  };

  const handleConfirmBlockUser = () => {
    blockUserMutation(friend);
    setOpenDialog(null);
  };

  const handleConfirmRemoveFriend = () => {
    removeFriend(friend.userId);
    setOpenDialog(null);
  };

  // The friends list has the full width of the main column and only an overflow
  // menu, so it keeps the wide row and the larger avatar.
  return (
    <FriendSummaryView friend={friend} isCompact={false}>
      <EllipsisMenu
        idName="friend-item"
        isMenuOpen={isMenuOpen}
        menuAnchorEl={menuAnchorEl}
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
        items={[
          {
            icon: PersonRemove,
            label: t("connections:remove_friend"),
            onClick: handleRemoveFriend,
            id: "remove-friend",
          },
          {
            icon: Block,
            label: t("connections:block_user"),
            onClick: handleBlockUser,
            id: "block-user",
          },
        ]}
      />
      {openDialog === "remove-friend" && (
        <ConnectionActionDialog
          dialogConfirm={t("connections:remove_friend_confirmation_dialog.confirm")}
          dialogId="friend-item--confirmation-dialog"
          dialogMessage={t("connections:remove_friend_confirmation_dialog.message", { name: friend.name })}
          dialogTitle={t("connections:remove_friend_confirmation_dialog.title")}
          isLoading={isRemoving}
          onConfirm={handleConfirmRemoveFriend}
          isOpen={openDialog === "remove-friend"}
          onClose={handleDialogClose}
        />
      )}
      {openDialog === "block-user" && (
        <ConnectionActionDialog
          dialogConfirm={t("connections:block_user_confirmation_dialog.confirm")}
          dialogId="block-user--confirmation-dialog"
          dialogMessage={t("connections:block_user_confirmation_dialog.message")}
          dialogTitle={t("connections:block_user_confirmation_dialog.title", {
            name: friend.name,
          })}
          isLoading={isBlocking}
          onConfirm={handleConfirmBlockUser}
          isOpen={openDialog === "block-user"}
          onClose={handleDialogClose}
        />
      )}
    </FriendSummaryView>
  );
};

export default FriendItem;
