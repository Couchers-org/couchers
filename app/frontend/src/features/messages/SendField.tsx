import { Box, makeStyles } from "@material-ui/core";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { Error as GrpcError } from "grpc-web";
import Button from "../../components/Button";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import TextField from "../../components/TextField";

const useStyles = makeStyles((theme) => ({
  root: { marginTop: theme.spacing(2) },
  container: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sendButton: {
    display: "block",
    marginInline: "auto",
    marginTop: theme.spacing(2),
    [theme.breakpoints.up("md")]: {
      margin: 0,
      marginInlineStart: theme.spacing(2),
    },
  },
}));

interface MessageFormData {
  text: string;
}

export interface SendFieldProps {
  sendMutation: UseMutationResult<
    string | undefined | Empty,
    GrpcError,
    string
  >;
}

export default function SendField({ sendMutation }: SendFieldProps) {
  const classes = useStyles();

  const { mutate: handleSend, isLoading } = sendMutation;

  const { register, handleSubmit } = useForm<MessageFormData>();
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text);
  });

  return (
    <Box className={classes.root}>
      <form onSubmit={onSubmit} className={classes.container}>
        <TextField
          label="Message"
          name="text"
          defaultValue={""}
          inputRef={register}
          rowsMax={5}
          variant="outlined"
          multiline
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={onSubmit}
          loading={isLoading}
          className={classes.sendButton}
        >
          Send
        </Button>
      </form>
    </Box>
  );
}
