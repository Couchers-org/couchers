import React, { ReactElement, useState } from "react";

import Button from "./Button";
import { YES } from "./constants";
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
          <Button onClick={handleConfirm}>
            {confirmButtonLabel ? confirmButtonLabel : YES}
          </Button>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
