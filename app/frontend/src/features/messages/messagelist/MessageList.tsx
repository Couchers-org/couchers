import { Box, BoxProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { useForm } from "react-hook-form";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { Message } from "../../../pb/conversations_pb";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import MessageView from "./Message";

const useStyles = makeStyles({
  root: {},
  list: {
    display: "flex",
    flexDirection: "column-reverse",
  },
});

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
  const isMounted = useIsMounted();
  const [error, setError] = useSafeState(isMounted, "");
  const { register, handleSubmit } = useForm<MessageFormData>();
  const classes = useStyles();

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    setError("");
    try {
      handleSend(data.text);
    } catch (error) {
      setError(error.message);
    }
  });

  return (
    <Box className={classes.root}>
      {error && <Alert severity="error">{error}</Alert>}

      <Box className={classes.list}>
        {messages.length ? (
          messages.map((message) => (
            <MessageView key={message.messageId} message={message} />
          ))
        ) : (
          <>No messages</>
        )}
      </Box>

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
        >
          Send
        </Button>
      </form>
    </Box>
  );
}
