import { Typography } from "@material-ui/core";
import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import { useAuthContext } from "features/auth/AuthProvider";
import useSendFieldStyles from "features/messages/useSendFieldStyles";
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
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";

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

function FieldButton({
  children,
  callback,
  disabled,
  isLoading,
  isSubmit,
}: {
  children: string;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
  isSubmit?: boolean;
}) {
  const classes = useSendFieldStyles();
  return (
    <Button
      className={classes.button}
      color="primary"
      disabled={disabled}
      loading={isLoading}
      onClick={callback}
      type={isSubmit ? "submit" : "button"}
      variant="contained"
    >
      {children}
    </Button>
  );
}

export default function HostRequestSendField({
  hostRequest,
  sendMutation,
  respondMutation,
}: HostRequestSendFieldProps) {
  const { t } = useTranslation([MESSAGES, GLOBAL]);
  const classes = useSendFieldStyles();
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

  return (
    <form onSubmit={onSubmit}>
      {hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING && (
        <div className={classes.helpTextContainer}>
          <Typography variant="body1">
            <Trans i18nKey="profile:request_form.guide_link_help_text">
              Not sure how to respond? Read some tips on{" "}
              <StyledLink
                variant="body1"
                href="https://help.couchers.org/hc/couchersorg-help-center/articles/1715658357-how-to-write-a-request-that-gets-accepted"
              >
                how to respond to a request
              </StyledLink>
              .
            </Trans>
          </Typography>
        </div>
      )}
      <div className={classes.buttonContainer}>
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
                <Button
                  className={classes.button}
                  color="primary"
                  component="a"
                >
                  {t("messages:write_reference_button_text")}
                </Button>
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
                <Button
                  className={classes.button}
                  color="primary"
                  component="a"
                >
                  {t("messages:write_reference_button_text")}
                </Button>
              </Link>
            )}
          </>
        )}
      </div>
      <div className={classes.container}>
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
            className: isRequestClosed ? classes.requestClosedLabel : undefined,
            shrink: isRequestClosed ? false : undefined,
          }}
          inputRef={register}
          multiline
          name="text"
          onKeyDown={handleKeyDown}
          maxRows={6}
          size="small"
          className={classes.textField}
        />
        <FieldButton
          callback={onSubmit}
          disabled={isRequestClosed}
          isLoading={isButtonLoading}
          isSubmit
        >
          {t("global:send")}
        </FieldButton>
      </div>
    </form>
  );
}
