import Button from "components/Button";
import ConfirmationDialogWrapper from "components/ConfirmationDialogWrapper";
import TextField from "components/TextField";
import useAuthStore from "features/auth/useAuthStore";
import {
  CLOSE_REQUEST_DIALOG_HOST,
  CLOSE_REQUEST_DIALOG_SURFER,
  CLOSE_REQUEST_DIALOG_TITLE,
  REQUEST_CLOSED_MESSAGE,
  WRITE_REFERENCE,
} from "features/messages/constants";
import useSendFieldStyles from "features/messages/useSendFieldStyles";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { HostRequestStatus } from "proto/conversations_pb";
import { ReferenceType } from "proto/references_pb";
import { HostRequest, RespondHostRequestReq } from "proto/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { Link } from "react-router-dom";
import { leaveReferenceBaseRoute, referenceTypeRoute } from "routes";

interface MessageFormData {
  text: string;
}

export interface HostRequestSendFieldProps {
  hostRequest: HostRequest.AsObject;
  sendMutation: UseMutationResult<
    string | undefined | Empty,
    GrpcError,
    string
  >;
  respondMutation: UseMutationResult<
    unknown,
    GrpcError,
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
  const classes = useSendFieldStyles();

  const isHost = hostRequest.hostUserId === useAuthStore().authState.userId;

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
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED &&
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
      <div className={classes.buttonContainer}>
        {isHost ? (
          <>
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) && (
              <FieldButton callback={handleAccept} isLoading={isButtonLoading}>
                Accept
              </FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <ConfirmationDialogWrapper
                title={CLOSE_REQUEST_DIALOG_TITLE}
                message={CLOSE_REQUEST_DIALOG_HOST}
                onConfirm={handleReject}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    Reject
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <Button className={classes.button} color="primary">
                <Link
                  to={{
                    pathname: `${leaveReferenceBaseRoute}/${
                      referenceTypeRoute[ReferenceType.REFERENCE_TYPE_HOSTED]
                    }/${hostRequest.surferUserId}/${hostRequest.hostRequestId}`,
                  }}
                >
                  {WRITE_REFERENCE}
                </Link>
              </Button>
            )}
          </>
        ) : (
          //user is the surfer
          <>
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED && (
              <FieldButton callback={handleConfirm} isLoading={isButtonLoading}>
                Confirm
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
                title={CLOSE_REQUEST_DIALOG_TITLE}
                message={CLOSE_REQUEST_DIALOG_SURFER}
                onConfirm={handleCancel}
              >
                {(setIsOpen) => (
                  <FieldButton
                    isLoading={isButtonLoading}
                    callback={() => setIsOpen(true)}
                  >
                    Cancel
                  </FieldButton>
                )}
              </ConfirmationDialogWrapper>
            )}
            {isReferenceAvailable && (
              <Button className={classes.button} color="primary">
                <Link
                  to={{
                    pathname: `${leaveReferenceBaseRoute}/${
                      referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED]
                    }/${hostRequest.hostUserId}/${hostRequest.hostRequestId}`,
                  }}
                >
                  {WRITE_REFERENCE}
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
      <div className={classes.container}>
        <TextField
          defaultValue={""}
          disabled={isRequestClosed}
          fullWidth
          label={isRequestClosed ? REQUEST_CLOSED_MESSAGE : "Message"}
          id="host-request-message"
          InputLabelProps={{
            className: isRequestClosed ? classes.requestClosedLabel : undefined,
            shrink: isRequestClosed ? false : undefined,
          }}
          inputRef={register}
          multiline
          name="text"
          minRows={4}
          maxRows={6}
          onKeyDown={handleKeyDown}
        />
        <FieldButton
          callback={onSubmit}
          disabled={isRequestClosed}
          isLoading={isButtonLoading}
          isSubmit
        >
          Send
        </FieldButton>
      </div>
    </form>
  );
}
