import { DialogProps } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { eventKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function CancelEventDialog({
  eventId,
  ...props
}: DialogProps & { eventId: number }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const queryClient = useQueryClient();
  const cancelEventMutation = useMutation<Empty, RpcError, void>(
    () => service.events.cancelEvent(eventId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(eventKey(eventId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );

  const handleCancelEvent = () => cancelEventMutation.mutate();

  return (
    <Dialog {...props} aria-labelledby="cancel-event-dialog-title">
      <DialogTitle id="cancel-event-dialog-title">
        {t("communities:cancel_event_dialog.title")}
      </DialogTitle>
      <DialogContent>
        {cancelEventMutation.error && (
          <Alert severity="error">{cancelEventMutation.error?.message}</Alert>
        )}
        <DialogContentText>
          {t("communities:cancel_event_dialog.message")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCancelEvent}
          loading={cancelEventMutation.isLoading}
        >
          {t("global:yes")}
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={cancelEventMutation.isLoading}
        >
          {t("global:no")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
