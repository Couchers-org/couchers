import { DialogProps } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "components/Dialog";
import { discussionKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { service } from "service";

export default function DeleteDiscussionDialog({ discussionId, ...props }: DialogProps & { discussionId: number }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const queryClient = useQueryClient();
  const deleteDiscussionMutation = useMutation<void, RpcError, void>({
    mutationFn: () => service.discussions.deleteDiscussion(discussionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discussionKey(discussionId),
      });
      if (props.onClose) props.onClose({}, "escapeKeyDown");
    },
  });

  return (
    <Dialog {...props} aria-labelledby="delete-discussion-dialog-title">
      <DialogTitle id="delete-discussion-dialog-title">{t("communities:delete_discussion_dialog.title")}</DialogTitle>
      <DialogContent>
        {deleteDiscussionMutation.error && <Alert severity="error">{deleteDiscussionMutation.error?.message}</Alert>}
        <DialogContentText>{t("communities:delete_discussion_dialog.message")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => (props.onClose ? props.onClose({}, "escapeKeyDown") : null)}
          loading={deleteDiscussionMutation.isPending}
        >
          {t("communities:delete_discussion_dialog.cancel")}
        </Button>
        <Button onClick={() => deleteDiscussionMutation.mutate()} loading={deleteDiscussionMutation.isPending}>
          {t("communities:delete_discussion_dialog.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
