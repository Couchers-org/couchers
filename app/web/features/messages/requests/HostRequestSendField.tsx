import { styled } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import TextField from "components/TextField";
import { HostRequest } from "couchers/proto/requests_pb";
import { useAuthContext } from "features/auth/AuthProvider";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import React from "react";
import { useForm } from "react-hook-form";

import FieldButton from "./FieldButton";
import HostRequestGuideLinks from "./HostRequestGuideLinks";

interface MessageFormData {
  text: string;
}

interface HostRequestSendFieldProps {
  hostRequest: HostRequest.AsObject;
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
}

const StyledContainer = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  gap: theme.spacing(1),
  marginTop: theme.spacing(3),
}));

export default function HostRequestSendField({
  hostRequest,
  sendMutation,
}: HostRequestSendFieldProps) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);
  const { authState } = useAuthContext();

  const isHost = hostRequest.hostUserId === authState.userId;

  const { mutate: handleSend, isPending } = sendMutation;

  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>();
  const messageText = watch("text", "");
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
    reset();
  });

  const isPast = hostRequest.toDate < new Date().toISOString().split("T")[0];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <HostRequestGuideLinks
        isPast={isPast}
        isHost={isHost}
        status={hostRequest.status}
      />
      <StyledContainer>
        <TextField
          {...register("text")}
          fullWidth
          aria-label={t("messages:chat_input.label")}
          label={t("messages:chat_input.label")}
          id="host-request-message"
          multiline
          onKeyDown={handleKeyDown}
          maxRows={6}
          size="small"
          sx={{ background: "var(--mui-palette-background-paper)" }}
        />
        <FieldButton
          callback={onSubmit}
          disabled={!messageText.trim()}
          isLoading={isPending}
          isSubmit
        >
          {t("global:send")}
        </FieldButton>
      </StyledContainer>
    </form>
  );
}
