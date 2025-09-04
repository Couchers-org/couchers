import CloseIcon from "@mui/icons-material/Close";
import {
  DialogActionsProps,
  DialogContentProps,
  DialogContentTextProps,
  DialogProps,
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogContentText as MuiDialogContentText,
  DialogTitle as MuiDialogTitle,
  DialogTitleProps as MuiDialogTitleProps,
} from "@mui/material";
import React from "react";

import IconButton from "@/components/IconButton";
import { theme } from "@/theme";

export interface AccessibleDialogProps extends Omit<DialogProps, "className"> {
  "aria-labelledby": string;
}

export function Dialog(props: AccessibleDialogProps) {
  return <MuiDialog {...props} fullWidth maxWidth="sm" scroll="body" />;
}

export function DialogActions(props: Omit<DialogActionsProps, "className">) {
  return (
    <MuiDialogActions
      {...props}
      sx={{
        display: "flex",
        justifyContent: "center",
        margin: 0,
        padding: theme.spacing(2),
        paddingTop: 0,
      }}
    />
  );
}

export function DialogContent(props: Omit<DialogContentProps, "className">) {
  return (
    <MuiDialogContent
      {...props}
      sx={{
        height: "fit-content",
        padding: theme.spacing(3),
        paddingTop: 0,
        width: "100%",
      }}
    />
  );
}

export function DialogContentText(props: DialogContentTextProps) {
  return (
    <MuiDialogContentText
      {...props}
      sx={{ padding: theme.spacing(2), ...props.sx }}
    />
  );
}

interface DialogTitleProps extends Omit<MuiDialogTitleProps, "className"> {
  onClose?: () => void;
}

export function DialogTitle({
  children,
  onClose,
  ...dialogTitleProps
}: DialogTitleProps) {
  return (
    <MuiDialogTitle
      {...dialogTitleProps}
      sx={{
        "&": theme.typography.h2,
        padding: theme.spacing(2),
        textAlign: "center",
      }}
    >
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="large"
          sx={{
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
      {children}
    </MuiDialogTitle>
  );
}
