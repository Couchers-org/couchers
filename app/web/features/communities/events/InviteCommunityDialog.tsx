import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useMutation, useQueryClient } from "react-query";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { DialogProps, Link as MuiLink } from "@material-ui/core";
import { eventKey } from "features/queryKeys";
import Button from "components/Button";
import { useTranslation } from "i18n";
import Alert from "components/Alert";
import { RpcError } from "grpc-web";
import { service } from "service";
import React from "react";

export default function InviteCommunityDialog({
  eventId,
  afterSuccess,
  ...props
}: DialogProps & { eventId: number; afterSuccess: () => void }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const queryClient = useQueryClient();
  const inviteCommunityMutation = useMutation<Empty, RpcError, void>(
    () => service.events.RequestCommunityInvite(eventId),
    {
      onSuccess: () => {
        afterSuccess();
        queryClient.invalidateQueries(eventKey(eventId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );

  const inviteCommunity = () => inviteCommunityMutation.mutate();

  return (
    <Dialog {...props} aria-labelledby="invite-community-dialog-title">
      <DialogTitle id="invite-community-dialog-title">
        {t("communities:invite_community_dialog.title")}
      </DialogTitle>
      <DialogContent>
        {inviteCommunityMutation.error && (
          <Alert severity="error">
            {inviteCommunityMutation.error?.message}
          </Alert>
        )}
        <DialogContentText>
          {t("communities:invite_community_dialog.message")}
          <br />
          <br />
          <MuiLink
            key={"link_invite_community"}
            target="_blank"
            rel="noreferrer"
            href={
              "https://help.couchers.org/hc/couchersorg-help-center/articles/1720304409-how-does-the-invite-the-community-feature-work"
            }
          >
            {t("communities:invite_community_dialog.link")}
          </MuiLink>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={inviteCommunity}
          loading={inviteCommunityMutation.isLoading}
        >
          {t("communities:invite_community_dialog_buttons.confirm")}
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={inviteCommunityMutation.isLoading}
        >
          {t("communities:invite_community_dialog_buttons.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
