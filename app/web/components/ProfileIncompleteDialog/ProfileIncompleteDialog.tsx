import Button from "components/Button";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "components/Dialog";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import Link from "next/link";
import React from "react";
import { howToCompleteProfileUrl, routeToEditProfile } from "routes";

export type ProfileIncompleteAction =
  | "create_event"
  | "send_message"
  | "send_request"
  | "create_public_trip"
  | "send_friend_request"
  | "create_discussion"
  | "post_comment";

interface ProfileIncompleteDialogProps {
  open: boolean;
  onClose: () => void;
  attempted_action: ProfileIncompleteAction;
}

export default function ProfileIncompleteDialog({ open, onClose, attempted_action }: ProfileIncompleteDialogProps) {
  const { t } = useTranslation([PROFILE]);

  const action_text = t(`profile:complete_profile_dialog.actions.${attempted_action}`);

  return (
    <Dialog aria-labelledby="profile-incomplete-dialog-title" open={open} onClose={onClose}>
      <DialogTitle id="profile-incomplete-dialog-title">{t("profile:complete_profile_dialog.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans
            i18nKey="profile:complete_profile_dialog.description_1"
            values={{ action_name: action_text }}
            components={{ 4: <strong />, 7: <strong /> }}
          />
        </DialogContentText>
        <DialogContentText>
          <Trans
            i18nKey="profile:complete_profile_dialog.description_2"
            components={{ 2: <StyledLink href={howToCompleteProfileUrl} /> }}
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} sx={{ textAlign: "center" }}>
          {t("profile:complete_profile_dialog.cancel_button")}
        </Button>
        <Button component={Link} href={routeToEditProfile()} sx={{ textAlign: "center" }}>
          {t("profile:complete_profile_dialog.edit_profile_button")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
