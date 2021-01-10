import { BoxProps, Box, TextField } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "react-query";
import { HostRequest } from "../../pb/requests_pb";
import { service } from "../../service";
import { Error as GrpcError } from "grpc-web";
import Button from "../../components/Button";

interface MessageFormData {
  text: string;
}

export interface SendFieldProps extends BoxProps {
  hostRequest: HostRequest.AsObject;
  setError: (text: string | null) => void;
}

export default function SendField({
  hostRequest,
  setError,
  ...otherProps
}: SendFieldProps) {
  const queryClient = useQueryClient();
  const { mutate: handleSend, isLoading } = useMutation<
    string | undefined,
    GrpcError,
    string
  >(
    (text) =>
      service.requests.sendHostRequestMessage(hostRequest.hostRequestId, text),
    {
      onMutate: () => {
        setError(null);
      },
      onSuccess: () => {
        queryClient.invalidateQueries([
          "hostRequestMessages",
          hostRequest.hostRequestId,
        ]);
        queryClient.invalidateQueries(["hostRequests"]);
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );

  const { register, handleSubmit } = useForm<MessageFormData>();
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
  });

  return (
    <Box {...otherProps}>
      <form onSubmit={onSubmit}>
        <TextField
          label="Text"
          name="text"
          defaultValue={""}
          inputRef={register}
          rowsMax={5}
          multiline
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={onSubmit}
          loading={isLoading}
        >
          Send
        </Button>
      </form>
    </Box>
  );
}
