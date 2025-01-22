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
  onConfirm: () => void;
}

export default function ConfirmationDialogWrapper({
  children,
  title,
  message,
  confirmButtonLabel,
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
      <Dialog visible={isOpen} onDismiss={() => setIsOpen(false)}>
        <DialogTitle id={ariaLabel}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onPress={handleConfirm} title={confirmButtonLabel ? confirmButtonLabel : t("confirm")} />
          <Button onPress={() => setIsOpen(false)} title={t("cancel")} />
        </DialogActions>
      </Dialog>
    </>
  );
}
