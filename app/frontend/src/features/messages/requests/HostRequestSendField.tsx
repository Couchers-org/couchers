import Button from "components/Button";
import TextField from "components/TextField";
import useAuthStore from "features/auth/useAuthStore";
import {
  REQUEST_CLOSED_MESSAGE,
  WRITE_REFERENCE,
} from "features/messages/constants";
import useSendFieldStyles from "features/messages/useSendFieldStyles";
import { useListAvailableReferences } from "features/profile/hooks/referencesHooks";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { HostRequestStatus } from "pb/conversations_pb";
import { HostRequest, RespondHostRequestReq } from "pb/requests_pb";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { Link } from "react-router-dom";
import { leaveReferenceBaseRoute } from "routes";

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
}: {
  children: string;
  callback: () => void;
  disabled?: boolean;
  isLoading: boolean;
}) {
  const classes = useSendFieldStyles();
  return (
    <Button
      className={classes.button}
      color="primary"
      disabled={disabled}
      loading={isLoading}
      onClick={callback}
      type="submit"
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

  const isHost = hostRequest.toUserId === useAuthStore().authState.userId;

  const { data: availableRefrences } = useListAvailableReferences(
    isHost ? hostRequest.fromUserId : hostRequest.toUserId
  );

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

  const isRequestClosed =
    hostRequest.toDate < new Date().toISOString().split("T")[0] ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED ||
    hostRequest.status === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED;

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
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED &&
              availableRefrences &&
              availableRefrences.availableWriteReferencesList.find(
                ({ hostRequestId }) =>
                  hostRequestId === hostRequest.hostRequestId
              ) && (
                <Button className={classes.button} color="primary">
                  <Link
                    to={{
                      pathname: `${leaveReferenceBaseRoute}/hosted/${hostRequest.fromUserId}/${hostRequest.hostRequestId}`,
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
              <FieldButton callback={handleCancel} isLoading={isButtonLoading}>
                Cancel
              </FieldButton>
            )}
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED &&
              availableRefrences &&
              availableRefrences.availableWriteReferencesList.find(
                ({ hostRequestId }) =>
                  hostRequestId === hostRequest.hostRequestId
              ) && (
                <Button className={classes.button} color="primary">
                  <Link
                    to={{
                      pathname: `${leaveReferenceBaseRoute}/surfed/${hostRequest.toUserId}/${hostRequest.hostRequestId}`,
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
          rows={4}
          rowsMax={6}
        />
        <FieldButton
          callback={onSubmit}
          disabled={isRequestClosed}
          isLoading={isButtonLoading}
        >
          Send
        </FieldButton>
      </div>
    </form>
  );
}
