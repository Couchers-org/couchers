import { useTranslation } from "i18n";
import React, { ReactElement, useState } from "react";

import Button from "./Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "./Dialog";

interface ConfirmationDialogWrapperProps {
  children: (setIsOpen: (value: boolean) => void) => ReactElement;
  title: string;
  message: string;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  onConfirm: () => void;
}

export default function ConfirmationDialogWrapper({
  children,
  title,
  message,
  confirmButtonLabel,
  cancelButtonLabel,
  onConfirm,
}: ConfirmationDialogWrapperProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ariaLabel = `${title.replace(/\s+/g, "")}-confirmation-dialog`;
  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };
  return (
    <>
      {children(setIsOpen)}
      <Dialog aria-labelledby={ariaLabel} open={isOpen}>
        <DialogTitle id={ariaLabel}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setIsOpen(false)}>
            {cancelButtonLabel ?? t("cancel")}
          </Button>
          <Button onClick={handleConfirm}>
            {confirmButtonLabel ? confirmButtonLabel : t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
