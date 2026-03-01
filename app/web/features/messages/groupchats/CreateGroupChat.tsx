import {
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  styled,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Autocomplete from "components/Autocomplete";
import Avatar from "components/Avatar";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import { AddIcon } from "components/Icons";
import TextField from "components/TextField";
import useFriendList from "features/connections/friends/useFriendList";
import { groupChatsListKey } from "features/queryKeys";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { LiteUser, User } from "proto/api_pb";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { routeToGroupChat, routeToUser } from "routes";
import { service } from "service";
import { theme } from "theme";
import stringOrFirstString from "utils/stringOrFirstString";

const StyledTextField = styled(TextField)(() => ({
  marginTop: theme.spacing(1),
  "& .MuiInputBase-root": {
    width: "100%",
  },
}));

const StyledAutocomplete = styled(
  Autocomplete<LiteUser.AsObject, true, false, undefined>,
)(() => ({
  marginTop: theme.spacing(1),
  "& .MuiInputBase-root": {
    width: "100%",
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  [theme.breakpoints.up("md")]: {
    width: 40,
    height: 40,
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1rem",
    [theme.breakpoints.up("md")]: {
      fontSize: "1.25rem",
    },
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  paddingTop: theme.spacing(0.75),
  paddingBottom: theme.spacing(0.75),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

interface CreateGroupChatFormData {
  title: string;
  users: User.AsObject[];
}

export default function CreateGroupChat({ className }: { className?: string }) {
  const { t } = useTranslation([MESSAGES]);

  //handle redirects which want to create a new message with someone
  const router = useRouter();
  const createMessageToUsername = stringOrFirstString(router.query.to);
  const [isOpen, setIsOpen] = useState(!!createMessageToUsername);
  const createMessageToUserQuery = useUserByUsername(
    createMessageToUsername ?? "",
  );

  const friends = useFriendList();
  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
  } = useForm<CreateGroupChatFormData>();

  const queryClient = useQueryClient();
  const {
    mutate: createGroupChat,
    isPending: isCreateLoading,
    error: createError,
    reset: resetMutationStatus,
  } = useMutation<number, RpcError, CreateGroupChatFormData>({
    mutationFn: ({ title, users }) =>
      service.conversations.createGroupChat(title, users),
    onSuccess: (chatId) => {
      queryClient.invalidateQueries({
        queryKey: [groupChatsListKey],
      });
      resetForm();
      setIsOpen(false);
      router.push(routeToGroupChat(chatId));
    },
  });

  const onSubmit = handleSubmit(({ title, users }: CreateGroupChatFormData) =>
    createGroupChat({ title, users }),
  );

  const handleClose = () => {
    setIsOpen(false);
    resetMutationStatus();
  };

  const errors = [...friends.errors];
  if (createError) errors.push(createError.message);

  const [isGroup, setIsGroup] = useState(false);

  return (
    <>
      <StyledListItemButton
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <ListItemAvatar>
          <StyledAvatar>
            <AddIcon />
          </StyledAvatar>
        </ListItemAvatar>
        <ListItemText>{t("messages:create_chat.group_title")}</ListItemText>
      </StyledListItemButton>
      <Dialog
        aria-labelledby="create-dialog-title"
        open={isOpen}
        onClose={handleClose}
        keepMounted={
          //prevents the form state being lost
          true
        }
      >
        <form onSubmit={onSubmit}>
          <DialogTitle id="create-dialog-title">
            {isGroup
              ? t("messages:create_chat.group_title")
              : t("messages:create_chat.dm_title")}
          </DialogTitle>
          <DialogContent>
            {!!errors.length && (
              <Alert severity={"error"}>{errors.join("\n")}</Alert>
            )}
            {isGroup && (
              <StyledTextField
                {...register("title")}
                id="group-chat-title"
                label={t("messages:title_label")}
              />
            )}
            {createMessageToUserQuery.error && (
              <Alert severity="error">{createMessageToUserQuery.error}</Alert>
            )}
            {
              // need to mount the autocomplete with the correct default value
              // of the "to" user, display a dummy loader until then
              !createMessageToUserQuery.isLoading ? (
                <Controller
                  control={control}
                  name="users"
                  defaultValue={
                    createMessageToUserQuery.data
                      ? [createMessageToUserQuery.data]
                      : []
                  }
                  render={({ field }) => {
                    return (
                      <StyledAutocomplete
                        id="users-autocomplete"
                        isOptionEqualToValue={(friend, value) => {
                          return friend?.name === value?.name;
                        }}
                        onChange={(_, newValue) => {
                          field.onChange(newValue);
                          setIsGroup((newValue?.length ?? 0) > 1);
                        }}
                        multiple
                        loading={friends.isLoading}
                        options={friends.data ?? []}
                        noOptionsText={t(
                          "messages:create_chat.no_friends_found_message",
                        )}
                        getOptionLabel={(friend) => {
                          const friendHasNameKey =
                            typeof friend === "object" && friend !== null;

                          return friendHasNameKey
                            ? friend.name
                            : t("messages:create_chat.user_load_error_message");
                        }}
                        label={t("messages:create_chat.friends_input_label")}
                        value={field.value ?? []}
                      />
                    );
                  }}
                />
              ) : (
                <Autocomplete
                  id="loading-users-autocomplete"
                  loading
                  multiple
                  options={[]}
                  label={t("messages:create_chat.friends_input_label")}
                  value={[]}
                />
              )
            }
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={onSubmit}
              loading={isCreateLoading}
            >
              {t("messages:create_chat.create_button")}
            </Button>
            {createMessageToUsername && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() =>
                  router.push(routeToUser(createMessageToUsername))
                }
              >
                {t("messages:create_chat.back_button")}
              </Button>
            )}
          </DialogActions>
          {createMessageToUsername && (
            <Typography variant="body2" sx={{ px: 3, pb: 2 }}>
              <Trans i18nKey="messages:create_chat.hosting_request_hint">
                Sending a hosting request? Go <strong>Back</strong> and use the{" "}
                <strong>Request</strong> button instead.
              </Trans>
            </Typography>
          )}
        </form>
      </Dialog>
    </>
  );
}
