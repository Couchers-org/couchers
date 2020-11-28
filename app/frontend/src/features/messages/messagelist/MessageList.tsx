import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { Message } from "../../../pb/conversations_pb";
import MessageView from "./Message";

const useStyles = makeStyles({ root: {} });

interface MessageFormData {
  text: string;
}

export interface MessageListProps extends BoxProps {
  messages: Array<Message.AsObject>;
  handleSend: (text: string) => void;
}

export default function MessageList({
  messages,
  handleSend,
}: MessageListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit } = useForm<MessageFormData>();
  const classes = useStyles();

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    setLoading(true);
    setError("");
    try {
      await handleSend(data.text);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  });

  return (
    <Box className={classes.root}>
      {error && <Alert severity="error">{error}</Alert>}

      <>
        {messages.length ? (
          messages
            .reverse()
            .map((message) => (
              <MessageView key={message.messageId} message={message} />
            ))
        ) : (
          <>No messages</>
        )}
      </>

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
          loading={loading}
          type="submit"
          variant="contained"
          color="primary"
          onClick={onSubmit}
        >
          Send
        </Button>
      </form>
    </Box>
  );
}
