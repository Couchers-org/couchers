import { ButtonProps, styled } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";
import Button from "components/Button";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { HostRequestStatus } from "proto/conversations_pb";
import { ReferenceType } from "proto/references_pb";
import { HostRequest } from "proto/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { referenceTypeRoute, routeToLeaveReference } from "routes";
import { theme } from "theme";

import FieldButton from "./FieldButton";
import HostRequestGuideLinks from "./HostRequestGuideLinks";

interface MessageFormData {
  text: string;
}

interface HostRequestSendFieldProps {
  hostRequest: HostRequest.AsObject;
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
}

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const StyledButton = styled(Button)<ButtonProps>({
  display: "flex",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  alignItems: "center",
});

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

  const { data: availableRefrences } = useListAvailableReferences(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
  );

  const { mutate: handleSend, isPending } = sendMutation;

  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>();
  const messageText = watch("text", "");
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
    reset();
  });

  const isButtonLoading = isPending;

  const isPast = hostRequest.toDate < new Date().toISOString().split("T")[0];

  const isReferenceAvailable =
    (hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED ||
      hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) &&
    availableRefrences &&
    availableRefrences.availableWriteReferencesList.find(
      ({ hostRequestId }) => hostRequestId === hostRequest.hostRequestId,
    );

  const referenceRoute = routeToLeaveReference(
    referenceTypeRoute[
      isHost
        ? ReferenceType.REFERENCE_TYPE_HOSTED
        : ReferenceType.REFERENCE_TYPE_SURFED
    ],
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
    hostRequest.hostRequestId,
  );

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
      {isReferenceAvailable && (
        <StyledButtonContainer>
          <StyledButton color="primary" component={Link} href={referenceRoute}>
            {t("messages:write_reference_button_text")}
          </StyledButton>
        </StyledButtonContainer>
      )}
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
          isLoading={isButtonLoading}
          isSubmit
        >
          {t("global:send")}
        </FieldButton>
      </StyledContainer>
    </form>
  );
}
