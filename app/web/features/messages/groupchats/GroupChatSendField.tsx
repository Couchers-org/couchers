import { ButtonProps, styled } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import React from "react";
import { useForm } from "react-hook-form";

import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useTranslation } from "@/i18n";
import { GLOBAL, MESSAGES } from "@/i18n/namespaces";
import { usePersistedState } from "@/platform/usePersistedState";
import { theme } from "@/theme";

interface MessageFormData {
  text: string;
}

const StyledButton = styled(Button)<ButtonProps>({
  display: "block",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  marginBottom: 0,
  marginTop: "auto",
  alignItems: "center",
});

const StyledForm = styled("form")(({ theme }) => ({
  alignItems: "flex-start",
  display: "flex",
  marginTop: theme.spacing(3),
}));

export interface GroupChatSendFieldProps {
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  chatId: number;
  currentUserId: number;
}

const GroupChatSendField = ({
  sendMutation,
  chatId,
  currentUserId,
}: GroupChatSendFieldProps) => {
  const { t } = useTranslation([GLOBAL, MESSAGES]);

  const { mutate: handleSend, isPending } = sendMutation;

  const { register, handleSubmit, reset } = useForm<MessageFormData>();

  const [persistedMessage, setPersistedMessage, clearPersistedMessage] =
    usePersistedState(
      `messages.${currentUserId}.${chatId}`,
      "",
      "sessionStorage",
    );

  const onSubmit = handleSubmit((data: MessageFormData) => {
    handleSend(data.text.trimEnd());
    clearPersistedMessage();
    reset({ text: "" });
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      void onSubmit();
    }
  };

  const { onChange: textOnChange, ...textRegisterRest } = register("text");

  return (
    <StyledForm onSubmit={() => void onSubmit()}>
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
          void textOnChange(event);
        }}
        maxRows={4}
        size="small"
        sx={{ background: theme.palette.common.white }}
      />

      <StyledButton
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        loading={isPending}
      >
        {t("global:send")}
      </StyledButton>
    </StyledForm>
  );
};

export default GroupChatSendField;
