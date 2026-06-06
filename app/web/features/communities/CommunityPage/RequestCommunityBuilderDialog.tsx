import { DialogProps } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { service } from "service";

export default function RequestCommunityBuilderDialog({
  communityId,
  afterSuccess,
  ...props
}: DialogProps & { communityId: number; afterSuccess: () => void }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const requestMutation = useMutation<void, RpcError, void>({
    mutationFn: () => service.communities.requestCommunityBuilder(communityId),
    onSuccess: () => {
      afterSuccess();
      if (props.onClose) props.onClose({}, "escapeKeyDown");
    },
  });

  return (
    <Dialog {...props} aria-labelledby="request-community-builder-dialog-title">
      <DialogTitle id="request-community-builder-dialog-title">
        {t("communities:request_community_builder_dialog.title")}
      </DialogTitle>
      <DialogContent>
        {requestMutation.error && (
          <Alert severity="error">{requestMutation.error.message}</Alert>
        )}
        <DialogContentText>
          {t("communities:request_community_builder_dialog.message")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => requestMutation.mutate()}
          loading={requestMutation.isPending}
        >
          {t("communities:request_community_builder_dialog_buttons.confirm")}
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={requestMutation.isPending}
        >
          {t("communities:request_community_builder_dialog_buttons.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
