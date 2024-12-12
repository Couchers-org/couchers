import Button from "components/Button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { User } from "proto/api_pb";
import { useState } from "react";
import { useMutation } from "react-query";
import {
  getDirectMessage,
  sendMessage,
  createGroupChat,
} from "service/conversations";
import { routeToCreateMessage } from "routes";

export default function MessageUserButton({
  user,
  setMutationError,
}: {
  user: User.AsObject;
  setMutationError: (value: string) => void;
}) {
  const { t } = useTranslation(PROFILE);
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);

  const { mutate, isLoading: isSending } = useMutation<number | false, Error>(
    () => getDirectMessage(user.userId),
    {
      onMutate() {
        setMutationError("");
      },
      onError(e) {
        setMutationError(e.message);
      },
      onSuccess(data) {
        if (!data) {
          // If no existing thread, create a new group chat
          createGroupChat(user.name, [user])
            .then((newThreadId) => {
              sendMessageToThread(newThreadId); // Send the message to the new thread
            })
            .catch((e) => setMutationError(e.message));
        } else {
          // If thread exists, send message to the existing thread
          sendMessageToThread(data);
        }
      },
    }
  );
  const sendMessageToThread = (threadId: number) => {
    const req = {
      groupChatId: threadId,
      text: message,
    };
    sendMessage(req.groupChatId, req.text)
      .then(() => {
        setMessage(""); // Clear the input after sending
        setShowMessageDialog(false); // Close the dialog
      })
      .catch((e) => {
        setMutationError(e.message); // Handle errors
      });
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      alert(t("actions.message_empty_warning", "Message cannot be empty!")); // Fallback alert
      return;
    }
    mutate(); // Trigger mutation to check if the thread exists or needs to be created
  };

  const onClick = () => {
    setShowMessageDialog(true);
  };

  return (
    <>
      {/* Message Dialog for entering a message */}
      <Dialog
        open={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        maxWidth="sm" // Sets dialog width
        fullWidth // Expands dialog to full width
      >
        <DialogTitle>Message {user.name}</DialogTitle>
        <DialogContent>
          <TextField
            label={t("actions.message_input_label", "Enter your message")} // Fallback label
            fullWidth
            multiline
            rows={5} // Increase input size
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageDialog(false)}>
            {t("actions.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSendMessage} disabled={isSending}>
            {t("actions.send", "Send")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Button */}
      <Button loading={isSending} onClick={onClick} disabled={isSending}>
        {t("actions.message_label", "Message")}
      </Button>
    </>
  );
}
