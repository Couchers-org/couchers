import Button from "components/Button";
import TextField from "components/TextField";
import useAuthStore from "features/auth/useAuthStore";
import useSendFieldStyles from "features/messages/useSendFieldStyles";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { HostRequestStatus } from "pb/conversations_pb";
import { HostRequest, RespondHostRequestReq } from "pb/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";

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
  isLoading,
}: {
  children: string;
  callback: () => void;
  isLoading: boolean;
}) {
  const classes = useSendFieldStyles();
  return (
    <Button
      type="submit"
      variant="contained"
      color="primary"
      onClick={callback}
      loading={isLoading}
      className={classes.button}
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

  const isHost = hostRequest.toUserId === useAuthStore().authState.userId;

  const { mutate: handleSend, isLoading } = sendMutation;
  const {
    mutate: handleRespond,
    isLoading: isResponseLoading,
  } = respondMutation;

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
              <FieldButton callback={handleReject} isLoading={isButtonLoading}>
                Reject
              </FieldButton>
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
              <FieldButton callback={handleCancel} isLoading={isButtonLoading}>
                Cancel
              </FieldButton>
            )}
          </>
        )}
      </div>
      <div className={classes.container}>
        <TextField
          id="host-request-message"
          label="Message"
          name="text"
          defaultValue={""}
          inputRef={register}
          rows={4}
          rowsMax={6}
          multiline
          fullWidth
        />
        <FieldButton callback={onSubmit} isLoading={isButtonLoading}>
          Send
        </FieldButton>
      </div>
    </form>
  );
}
