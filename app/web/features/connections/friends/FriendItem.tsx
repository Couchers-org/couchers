import { PersonRemove } from "@mui/icons-material";
import { MenuItem, Typography } from "@mui/material";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import EllipsisMenu from "components/EllipsisMenu";
import { friendIdsKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { removeFriend } from "service/api";
import { theme } from "theme";

import FriendSummaryView from "./FriendSummaryView";

interface FriendItemProps {
  friend: LiteUser.AsObject;
  onError: (error: Error | null) => void;
}

const FriendItem = ({ friend, onError }: FriendItemProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation([GLOBAL, CONNECTIONS]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const isMenuOpen = Boolean(menuAnchorEl);

  const { mutate: removeFriendMutate, isLoading: isRemoving } = useMutation<
    Empty,
    Error,
    { friendId: number },
    { previousFriendIds?: number[] }
  >(({ friendId }) => removeFriend(friendId), {
    onMutate: async ({ friendId }) => {
      onError(null);
      await queryClient.cancelQueries(friendIdsKey);

      const previousFriendIds =
        queryClient.getQueryData<number[]>(friendIdsKey);
      const newFriendIds = previousFriendIds?.filter((id) => id !== friendId);

      if (newFriendIds) {
        queryClient.setQueryData<number[]>(friendIdsKey, newFriendIds);
      }

      return { previousFriendIds };
    },
    onError: (err, _, context) => {
      onError(err);
      if (context?.previousFriendIds) {
        queryClient.setQueryData(friendIdsKey, context.previousFriendIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(friendIdsKey);
    },
  });

  const handleRemoveFriend = (userId: number) => {
    if (userId !== undefined) {
      removeFriendMutate({ friendId: userId });
      handleDialogClose();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setMenuAnchorEl(null);
  };

  const handleDialogOpen = () => {
    handleMenuClose();
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <FriendSummaryView key={friend.userId} friend={friend}>
      <EllipsisMenu
        idName="friend-item"
        isMenuOpen={isMenuOpen}
        menuAnchorEl={menuAnchorEl}
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
      >
        <MenuItem onClick={handleDialogOpen} data-testid="remove-friend">
          <PersonRemove fontSize="small" />
          <Typography
            variant="body2"
            sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
          >
            {t("connections:remove_friend")}
          </Typography>
        </MenuItem>
      </EllipsisMenu>
      <Dialog
        aria-labelledby="friend-item--confirmation-dialog"
        open={isDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle id="friend-item--confirmation-dialog">
          {t("connections:remove_friend_confirmation_dialog.title")}
        </DialogTitle>
        <DialogContent>
          {t("connections:remove_friend_confirmation_dialog.message", {
            name: friend?.name,
          })}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleDialogClose}>
            {t("global:cancel")}
          </Button>
          <Button
            variant="contained"
            loading={isRemoving}
            onClick={() => handleRemoveFriend(friend.userId)}
          >
            {t("connections:remove_friend_confirmation_dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </FriendSummaryView>
  );
};

export default FriendItem;
