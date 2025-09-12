import Link from "next/link";
import React from "react";

import Button from "@/components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@/components/Dialog";
import StyledLink from "@/components/StyledLink";
import { Trans, useTranslation } from "@/i18n";
import { DASHBOARD } from "@/i18n/namespaces";
import { HOW_TO_COMPLETE_PROFILE_URL, routeToEditProfile } from "@/routes";

export interface ProfileIncompleteDialogProps {
  open: boolean;
  onClose: () => void;
  attemptedAction: "create_event" | "send_message" | "send_request";
}

const ProfileIncompleteDialog = ({
  open,
  onClose,
  attemptedAction,
}: ProfileIncompleteDialogProps) => {
  const { t } = useTranslation([DASHBOARD]);

  const actionText = t(
    `dashboard:complete_profile_dialog.actions.${attemptedAction}`,
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
            {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
            Before you can {{ action_name: actionText }}, you must{" "}
            <strong>write a bit about yourself</strong> in your profile and{" "}
            <strong>upload a profile photo</strong>.
          </Trans>
        </DialogContentText>
        <DialogContentText>
          <Trans i18nKey="dashboard:complete_profile_dialog.description_2">
            This helps build a trusted community and reduce spam. For more
            information,{" "}
            <StyledLink href={HOW_TO_COMPLETE_PROFILE_URL}>
              please refer to this help page
            </StyledLink>
            . Thank you for your help!
          </Trans>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button component={Link} href={routeToEditProfile()}>
          {t("dashboard:complete_profile_dialog.edit_profile_button")}
        </Button>
        <Button onClick={onClose}>
          {t("dashboard:complete_profile_dialog.cancel_button")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileIncompleteDialog;
