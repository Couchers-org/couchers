import React, { cloneElement, ReactElement, useState } from "react";

import Button from "./Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "./Dialog";

interface ConfirmationDialogWrapperProps<P extends { onClick: () => void }> {
  children: ReactElement<P>;
  title: string;
  message: string;
}

export default function ConfirmationDialogWrapper<
  P extends { onClick: () => void }
>({ children, title, message }: ConfirmationDialogWrapperProps<P>) {
  if (!children.props.onClick) {
    throw new Error(
      "Child of ConfirmationDialogWrapper must have onClick prop"
    );
  }
  const [isOpen, setIsOpen] = useState(false);
  const child = cloneElement<P>(children, {
    onClick: () => setIsOpen(true),
  } as P);
  const ariaLabel = `${title.replace(/\s+/g, "")}-confirmation-dialog`;
  const handleConfirm = () => {
    children.props.onClick();
    setIsOpen(false);
  };
  return (
    <>
      {child}
      <Dialog aria-labelledby={ariaLabel} open={isOpen}>
        <DialogTitle id={ariaLabel}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirm}>Yes</Button>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
