import { Box } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { Error as GrpcError } from "grpc-web";
import Button from "../../../components/Button";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import TextField from "../../../components/TextField";
import useSendFieldStyles from "../useSendFieldStyles";
import { HostRequest, RespondHostRequestReq } from "../../../pb/requests_pb";
import { HostRequestStatus } from "../../../pb/conversations_pb";
import useAuthStore from "../../auth/useAuthStore";
import classNames from "classnames";

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
        text: data.text,
        hostRequestId: hostRequest.hostRequestId,
        status,
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

  function FieldButton({
    children,
    callback,
  }: {
    children: string;
    callback: () => void;
  }) {
    return (
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={callback}
        loading={isLoading || isResponseLoading}
        className={classes.button}
      >
        {children}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className={classNames(classes.root)}>
      <Box className={classes.buttonContainer}>
        {isHost ? (
          <>
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) && (
              <FieldButton callback={handleAccept}>Accept</FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <FieldButton callback={handleReject}>Reject</FieldButton>
            )}
          </>
        ) : (
          //user is the surfer
          <>
            {hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED && (
              <FieldButton callback={handleConfirm}>Confirm</FieldButton>
            )}
            {(hostRequest.status ===
              HostRequestStatus.HOST_REQUEST_STATUS_PENDING ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_REJECTED ||
              hostRequest.status ===
                HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) && (
              <FieldButton callback={handleCancel}>Cancel</FieldButton>
            )}
          </>
        )}
      </Box>
      <Box className={classes.container}>
        <TextField
          label="Message"
          name="text"
          defaultValue={""}
          inputRef={register}
          rows={4}
          rowsMax={6}
          multiline
          fullWidth
        />
        <FieldButton callback={onSubmit}>Send</FieldButton>
      </Box>
    </form>
  );
}
