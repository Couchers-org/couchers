import { styled } from "@mui/material";
import Button, { AppButtonProps } from "components/Button";
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
import { HostRequest, RespondHostRequestReq } from "proto/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { referenceTypeRoute, routeToLeaveReference } from "routes";
import { theme } from "theme";

import FieldButton from "./FieldButton";
import HostRequestGuideLinks from "./HostRequestGuideLinks";
import HostRequestRespondButtons from "./HostRequestRespondButtons";

interface MessageFormData {
  text: string;
}

export interface HostRequestSendFieldProps {
  hostRequest: HostRequest.AsObject;
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  respondMutation: UseMutationResult<
    unknown,
    RpcError,
    Required<RespondHostRequestReq.AsObject>
  >;
}

const StyledButtonContainer = styled("div")(({ theme }) => ({
  "& > button": {
    marginInline: theme.spacing(2),
  },
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
}));

const StyledButton = styled(Button)<AppButtonProps>({
  display: "block",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  marginBottom: 0,
  marginTop: "auto",
  alignItems: "center",
});

const StyledContainer = styled("div")(({ theme }) => ({
  alignItems: "flex-start",
  display: "flex",
  marginTop: theme.spacing(3),
}));

export default function HostRequestSendField({
  hostRequest,
  sendMutation,
  respondMutation,
}: HostRequestSendFieldProps) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);
  const { authState } = useAuthContext();

  const isHost = hostRequest.hostUserId === authState.userId;

  const { data: availableRefrences } = useListAvailableReferences(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId
  );

  const { mutate: handleSend, isLoading } = sendMutation;
  const { mutate: handleRespond, isLoading: isResponseLoading } =
    respondMutation;

  const { register, handleSubmit, reset } = useForm<MessageFormData>();
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
    reset();
  });

  const handleStatus = (status: HostRequestStatus) =>
    handleSubmit(async (data: MessageFormData) => {
      handleRespond({
        hostRequestId: hostRequest.hostRequestId,
        status,
        text: data.text,
      });
      reset();
    });

  const isButtonLoading = isLoading || isResponseLoading;

  const isPast = hostRequest.toDate < new Date().toISOString().split("T")[0];

  const isRequestClosed =
    isPast ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

  const isReferenceAvailable =
    (hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED ||
      hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) &&
    availableRefrences &&
    availableRefrences.availableWriteReferencesList.find(
      ({ hostRequestId }) => hostRequestId === hostRequest.hostRequestId
    );

  const referenceRoute = routeToLeaveReference(
    referenceTypeRoute[
      isHost
        ? ReferenceType.REFERENCE_TYPE_HOSTED
        : ReferenceType.REFERENCE_TYPE_SURFED
    ],
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId,
    hostRequest.hostRequestId
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
      <StyledButtonContainer>
        {!isPast && (
          <HostRequestRespondButtons
            isHost={isHost}
            status={hostRequest.status}
            isLoading={isButtonLoading}
            handleStatus={handleStatus}
          />
        )}
        {isReferenceAvailable && (
          <Link href={referenceRoute} passHref>
            <StyledButton color="primary" component="a">
              {t("messages:write_reference_button_text")}
            </StyledButton>
          </Link>
        )}
      </StyledButtonContainer>
      <StyledContainer>
        <TextField
          defaultValue={
            isRequestClosed ? t("messages:request_closed_message") : ""
          }
          disabled={isRequestClosed}
          fullWidth
          aria-label={t("messages:chat_input.label")}
          label={!isRequestClosed ? t("messages:chat_input.label") : ""}
          id="host-request-message"
          InputLabelProps={{
            style: {
              transform: isRequestClosed ? "none" : undefined,
            },
            shrink: isRequestClosed ? false : undefined,
          }}
          inputRef={register}
          multiline
          name="text"
          onKeyDown={handleKeyDown}
          maxRows={6}
          size="small"
          sx={{ background: theme.palette.common.white }}
        />
        <FieldButton
          callback={onSubmit}
          disabled={isRequestClosed}
          isLoading={isButtonLoading}
          isSubmit
        >
          {t("global:send")}
        </FieldButton>
      </StyledContainer>
    </form>
  );
}
