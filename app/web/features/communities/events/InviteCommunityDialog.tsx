import { DialogProps, Link as MuiLink } from "@mui/material";
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
import { howToInviteCommunityUrl } from "routes";
import { service } from "service";

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
            href={howToInviteCommunityUrl}
            underline="hover"
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
