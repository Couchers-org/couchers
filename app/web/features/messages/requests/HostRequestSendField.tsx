import { styled, Typography } from "@mui/material";
import Button, { AppButtonProps } from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import Link from "next/link";
import { HostRequestStatus } from "proto/conversations_pb";
import { ReferenceType } from "proto/references_pb";
import { HostRequest, RespondHostRequestReq } from "proto/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import {
  howToRespondRequestGuideUrl,
  howToWriteRequestGuideUrl,
  leaveReferenceBaseRoute,
  referenceTypeRoute,
} from "routes";
import { theme } from "theme";

import FieldButton from "./FieldButton";

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

const StyledHelpTextContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
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
  const handleAccept = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED
  );
  const handleReject = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_REJECTED
  );
  const handleCancel = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED
  );
  const handleConfirm = handleStatus(
    HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED
  );

  const isButtonLoading = isLoading || isResponseLoading;

  const isRequestClosed =
    hostRequest.toDate < new Date().toISOString().split("T")[0] ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

  const isReferenceAvailable =
    (hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED ||
      hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) &&
    availableRefrences &&
    availableRefrences.availableWriteReferencesList.find(
      ({ hostRequestId }) => hostRequestId === hostRequest.hostRequestId
    );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const isHostPending =
    isHost &&
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING;

  const isSurferRejected =
    !isHost &&
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

  return (
    <form onSubmit={onSubmit}>
      {isHostPending && (
        <StyledHelpTextContainer>
          <Typography variant="body1">
            <Trans i18nKey="messages:host_pending_request_help_text">
              <StyledLink variant="body1" href={howToRespondRequestGuideUrl}>
                Things to consider
              </StyledLink>{" "}
              before responding.
            </Trans>
          </Typography>
        </StyledHelpTextContainer>
      )}
      {isSurferRejected && (
        <StyledHelpTextContainer>
          <Typography variant="body1">
            <Trans i18nKey="messages:surfer_declined_request_help_text">
              <StyledLink variant="body1" href={howToWriteRequestGuideUrl}>
                Read our guide
              </StyledLink>{" "}
              on how to write a request that will get accepted.
            </Trans>
          </Typography>
        </StyledHelpTextContainer>
      )}
      <StyledButtonContainer>
        {isHost ? (
          <>
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) && (
              <FieldButton callback={handleAccept} isLoading={isButtonLoading}>
                {t("global:accept")}
              </FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <ConfirmationDialogWrapper
                title={t("messages:close_request_dialog_title")}
                message={t("messages:close_request_dialog_host")}
                onConfirm={handleReject}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    {t("messages:close_request_button_text")}
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <Link
                href={{
                  pathname: `${leaveReferenceBaseRoute}/${
                    referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
                  }/${hostRequest.surferUserId}/${hostRequest.hostRequestId}`,
                }}
                passHref
              >
                <StyledButton color="primary" component="a">
                  {t("messages:write_reference_button_text")}
                </StyledButton>
              </Link>
            )}
          </>
        ) : (
          //user is the surfer
          <>
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED && (
              <FieldButton callback={handleConfirm} isLoading={isButtonLoading}>
                {t("messages:confirm_request_button_text")}
              </FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <ConfirmationDialogWrapper
                title={t("messages:close_request_dialog_title")}
                message={t("messages:close_request_dialog_surfer")}
                onConfirm={handleCancel}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    {t("global:cancel")}
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <Link
                href={{
                  pathname: `${leaveReferenceBaseRoute}/${
                    referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED]
                  }/${hostRequest.hostUserId}/${hostRequest.hostRequestId}`,
                }}
                passHref
              >
                <StyledButton color="primary" component="a">
                  {t("messages:write_reference_button_text")}
                </StyledButton>
              </Link>
            )}
          </>
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
