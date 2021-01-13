import { BoxProps, Box, TextField } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { Error as GrpcError } from "grpc-web";
import Button from "../../components/Button";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

interface MessageFormData {
  text: string;
}

export interface SendFieldProps extends BoxProps {
  sendMutation: UseMutationResult<
    string | undefined | Empty,
    GrpcError,
    string
  >;
}

export default function SendField({
  sendMutation,
  ...otherProps
}: SendFieldProps) {
  const { mutate: handleSend, isLoading } = sendMutation;

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
