import { MoreHoriz, PersonRemove } from "@mui/icons-material";
import {
  Alert,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Typography,
} from "@mui/material";
import { Dialog, DialogTitle } from "components/Dialog";
import UserSummary from "components/UserSummary";
import Button from "components/Button";
import { friendIdsKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { removeFriend } from "service/api";
import { theme } from "theme";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { SetMutationError } from ".";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject;
}

interface RemoveFriendProps {
  friendId: number;
  setMutationError: SetMutationError;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const StyledFriendItem = styled("div")(({ theme }) => ({
  padding: `0 ${theme.spacing(1)}`,
}));

const MenuWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  flexDirection: "column",
}));

function FriendSummaryView({ children, friend }: FriendSummaryViewProps) {
  const { t } = useTranslation([GLOBAL, CONNECTIONS]);
  const queryClient = useQueryClient();

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMenuOpen = Boolean(menuAnchorEl);

  const { mutate: removeFriendMutate, isLoading: isRemoving } = useMutation<
    Empty,
    Error,
    { friendId: number },
    { previousFriendIds?: number[] }
  >(({ friendId }) => removeFriend(friendId), {
    onMutate: async ({ friendId }) => {
      setError(null);
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
      setError(err);
      if (context?.previousFriendIds) {
        queryClient.setQueryData(friendIdsKey, context.previousFriendIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(friendIdsKey);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setMenuAnchorEl(null);
  };

  const handleRemoveFriend = () => {
    if (friend?.userId !== undefined) {
      removeFriendMutate({ friendId: friend.userId });
      handleDialogClose();
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const menu = (
    <MenuWrapper>
      {error && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
          {error.message}
        </Alert>
      )}
      <>
        <IconButton
          aria-controls={isMenuOpen ? "friend-item--more-options" : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? "true" : undefined}
          id="friend-item--more-options"
          data-testid="friend-item--more-options"
          onClick={handleMenuOpen}
          sx={{ width: 32, height: 32 }}
        >
          <MoreHoriz fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          id="friend-item--more-options"
          data-testid="friend-item--more-options"
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleDialogOpen}>
            <PersonRemove fontSize="small" />
            <Typography
              variant="body2"
              sx={{ marginLeft: theme.spacing(1), fontWeight: 500 }}
            >
              {t("connections:remove_friend")}
            </Typography>
          </MenuItem>
        </Menu>
      </>
    </MenuWrapper>
  );

  return friend ? (
    <>
      <StyledFriendItem data-testid={FRIEND_ITEM_TEST_ID}>
        <UserSummary
          headlineComponent="h3"
          user={friend}
          menu={menu}
        ></UserSummary>
        {children}
      </StyledFriendItem>
      <Dialog
        aria-labelledby="friend-item--confirmation-dialog"
        open={isDialogOpen}
        onClose={handleDialogClose}
      >
        <DialogTitle id="friend-item--confirmation-dialog">
          {t("connections:remove_friend_confirmation_dialog.title")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("connections:remove_friend_confirmation_dialog.message", {
              name: friend?.name,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleDialogClose}>
            {t("global:cancel")}
          </Button>
          <Button
            variant="contained"
            loading={isRemoving}
            onClick={handleRemoveFriend}
          >
            {t("connections:remove_friend_confirmation_dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  ) : null;
}

export default FriendSummaryView;
