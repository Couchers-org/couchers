import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import React from "react";
import { howToCompleteProfileUrl, routeToEditProfile } from "routes";

export interface ProfileIncompleteDialogProps {
  open: boolean;
  onClose: () => void;
  attempted_action: "create_event" | "send_message" | "send_request";
}

export default function ProfileIncompleteDialog({
  open,
  onClose,
  attempted_action,
}: ProfileIncompleteDialogProps) {
  const { t } = useTranslation([DASHBOARD]);

  const action_text = t(
    `dashboard:complete_profile_dialog.actions.${attempted_action}`
  );

  return (
    <Dialog
      aria-labelledby="profile-incomplete-dialog-title"
      open={open}
      onClose={onClose}
    >
      <DialogTitle id="profile-incomplete-dialog-title">
        {t("dashboard:complete_profile_dialog.title")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Trans i18nKey="dashboard:complete_profile_dialog.description_1">
            Before you can {{ action_name: action_text }}, you must{" "}
            <strong>write a bit about yourself</strong> in your profile and{" "}
            <strong>upload a profile photo</strong>.
          </Trans>
        </DialogContentText>
        <DialogContentText>
          <Trans i18nKey="dashboard:complete_profile_dialog.description_2">
            This helps build a trusted community and reduce spam. For more
            information,{" "}
            <StyledLink href={howToCompleteProfileUrl}>
              please refer to this help page
            </StyledLink>
            . Thank you for your help!
          </Trans>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Link href={routeToEditProfile()} passHref>
          <Button>
            {t("dashboard:complete_profile_dialog.edit_profile_button")}
          </Button>
        </Link>
        <Button onClick={onClose}>
          {t("dashboard:complete_profile_dialog.cancel_button")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
