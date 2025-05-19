import { MoreHoriz, PersonRemove } from "@mui/icons-material";
import {
  Alert,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Typography,
} from "@mui/material";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import UserSummary from "components/UserSummary";
import { friendIdsKey, liteUserKey, liteUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { GetLiteUsersRes, LiteUser } from "proto/api_pb";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { removeFriend } from "service/api";
import { theme } from "theme";

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: LiteUser.AsObject;
}

export const FRIEND_ITEM_TEST_ID = "friend-item";

const StyledFriendItem = styled("div")(({ theme }) => ({
  padding: `0 ${theme.spacing(1)}`,
}));

const MenuWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
}));

function FriendSummaryView({ children, friend }: FriendSummaryViewProps) {
  const { t } = useTranslation([CONNECTIONS]);

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );

  const isMenuOpen = Boolean(menuAnchorEl);

  const queryClient = useQueryClient();

  //@TODO(NA): This causes an unknown backend error and doesn't remove friend
  const { error, mutate: removeFriendMutation } = useMutation<void, RpcError>(
    async () => {
      if (!friend) {
        throw new Error("Friend not found");
      }
      await removeFriend(friend?.userId);
    },
    {
      onSuccess() {
        // 1. Remove the friend ID from the cached list
        queryClient.setQueryData<number[]>(
          friendIdsKey,
          (prevData) => prevData?.filter((id) => id !== friend?.userId) ?? [],
        );

        // 2. Remove `liteUsers` cache entries that include the deleted ID
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["liteUsers"] }) // base key must match `liteUsersKey()`
          .forEach((query) => {
            const existingKey = query.queryKey;
            const userIds = (existingKey as any[])[1] as number[]; // liteUsersKey([ids]) = ['liteUsers', [1,2,3]]
            if (
              friend?.userId !== undefined &&
              !userIds?.includes(friend.userId)
            )
              return;

            // Remove the user from the list of responses
            queryClient.setQueryData<GetLiteUsersRes.AsObject>(
              existingKey,
              (oldData) => {
                const defaultData: GetLiteUsersRes.AsObject = {
                  responsesList: [],
                };
                const data = oldData ?? defaultData;
                return {
                  ...data,
                  responsesList: data.responsesList.filter(
                    (response) => response.user?.userId !== friend?.userId,
                  ),
                };
              },
            );
          });
        queryClient.invalidateQueries([friendIdsKey, "liteUsers"]);
      },
    },
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setMenuAnchorEl(null);
  };

  const handleRemoveFriend = async () => {
    removeFriendMutation();
  };

  const menu = (
    <MenuWrapper>
      {error && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
          {error.message}
        </Alert>
      )}
      <ConfirmationDialogWrapper
        title={t("connections:remove_friend_confirmation_dialog.title")}
        message={t("connections:remove_friend_confirmation_dialog.message", {
          name: friend?.name,
        })}
        onConfirm={handleRemoveFriend}
        confirmButtonLabel={t(
          "connections:remove_friend_confirmation_dialog.confirm",
        )}
      >
        {(setIsOpen) => (
          <>
            <IconButton
              aria-controls={
                isMenuOpen ? "friend-item--more-options" : undefined
              }
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
              <MenuItem onClick={() => setIsOpen(true)}>
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
        )}
      </ConfirmationDialogWrapper>
    </MenuWrapper>
  );

  return friend ? (
    <StyledFriendItem data-testid={FRIEND_ITEM_TEST_ID}>
      <UserSummary
        headlineComponent="h3"
        user={friend}
        menu={menu}
      ></UserSummary>
      {children}
    </StyledFriendItem>
  ) : null;
}

export default FriendSummaryView;
