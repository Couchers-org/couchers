import { ButtonProps, styled } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { useClearablePersistedState } from "platform/usePersistedState";
import React from "react";
import { useForm } from "react-hook-form";

interface MessageFormData {
  text: string;
}

const StyledButton = styled(Button)<ButtonProps>(() => ({
  flexShrink: 0,
}));

const StyledForm = styled("form")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(3),
}));

interface GroupChatSendFieldProps {
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  chatId: number;
  currentUserId: number;
}

export default function GroupChatSendField({ sendMutation, chatId, currentUserId }: GroupChatSendFieldProps) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);

  const { mutate: handleSend, isPending } = sendMutation;

  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>();

  const [persistedMessage, setPersistedMessage, clearPersistedMessage] = useClearablePersistedState(
    `messages.${currentUserId}.${chatId}`,
    "",
    "sessionStorage",
  );

  const messageText = watch("text", persistedMessage ?? "");

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text.trimEnd());
    clearPersistedMessage();
    reset({ text: "" });
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const { onChange: textOnChange, ...textRegisterRest } = register("text");

  return (
    <StyledForm onSubmit={onSubmit}>
      <TextField
        id="group-chat-message-field"
        {...textRegisterRest}
        label={t("messages:chat_input.label")}
        defaultValue={persistedMessage ?? ""}
        multiline
        fullWidth
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setPersistedMessage(event.target.value);
          textOnChange(event);
        }}
        maxRows={4}
        size="small"
        sx={{ background: "var(--mui-palette-background-paper)" }}
      />

      <StyledButton
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        loading={isPending}
        disabled={!messageText.trim() || isPending}
      >
        {t("global:send")}
      </StyledButton>
    </StyledForm>
  );
}
