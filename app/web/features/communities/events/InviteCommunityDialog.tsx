import { DialogProps, Link as MuiLink } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import React from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@/components/Dialog";
import { eventKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { COMMUNITIES, GLOBAL } from "@/i18n/namespaces";
import { HOW_TO_INVITE_COMMUNITY_URL } from "@/routes";
import { service } from "@/service";

const InviteCommunityDialog = ({
  eventId,
  afterSuccess,
  ...props
}: DialogProps & { eventId: number; afterSuccess: () => void }) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const queryClient = useQueryClient();
  const inviteCommunityMutation = useMutation<Empty, RpcError>({
    mutationFn: () => service.events.requestCommunityInvite(eventId),
    onSuccess: async () => {
      afterSuccess();
      await queryClient.invalidateQueries({
        queryKey: eventKey(eventId),
      });
      if (props.onClose) props.onClose({}, "escapeKeyDown");
    },
  });

  const inviteCommunity = () => {
    inviteCommunityMutation.mutate();
  };

  return (
    <Dialog {...props} aria-labelledby="invite-community-dialog-title">
      <DialogTitle id="invite-community-dialog-title">
        {t("communities:invite_community_dialog.title")}
      </DialogTitle>
      <DialogContent>
        {inviteCommunityMutation.error && (
          <Alert severity="error">
            {inviteCommunityMutation.error.message}
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
            href={HOW_TO_INVITE_COMMUNITY_URL}
            underline="hover"
          >
            {t("communities:invite_community_dialog.link")}
          </MuiLink>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={inviteCommunity}
          loading={inviteCommunityMutation.isPending}
        >
          {t("communities:invite_community_dialog_buttons.confirm")}
        </Button>
        <Button
          onClick={() => props.onClose?.({}, "escapeKeyDown")}
          loading={inviteCommunityMutation.isPending}
        >
          {t("communities:invite_community_dialog_buttons.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteCommunityDialog;
