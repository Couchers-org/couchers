import React from "react";
import {
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogContentText as MuiDialogContentText,
  DialogTitle as MuiDialogTitle,
  DialogProps,
  makeStyles,
  DialogActionsProps,
  DialogContentProps,
  DialogContentTextProps,
  DialogTitleProps,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  dialog: { padding: 0 },
  actions: {
    display: "flex",
    justifyContent: "space-around",
    padding: theme.spacing(2),
    paddingTop: 0,
    margin: 0,
  },
  content: { padding: theme.spacing(2) },
  contentText: { padding: theme.spacing(2) },
  title: {
    padding: theme.spacing(2),
    paddingBottom: 0,
    textAlign: "center",
    //default typography is h2 with h6 styling
    "& > h2": {
      fontSize: 16,
      fontWeight: "bold",
    },
  },
}));

export interface AccessibleDialogProps extends Omit<DialogProps, "className"> {
  "aria-labelledby": string;
}

export function Dialog(props: AccessibleDialogProps) {
  const classes = useStyles();
  return <MuiDialog {...props} className={classes.dialog} />;
}

export function DialogActions(props: Omit<DialogActionsProps, "className">) {
  const classes = useStyles();
  return <MuiDialogActions {...props} className={classes.actions} />;
}

export function DialogContent(props: Omit<DialogContentProps, "className">) {
  const classes = useStyles();
  return <MuiDialogContent {...props} className={classes.content} />;
}

export function DialogContentText(
  props: Omit<DialogContentTextProps, "className">
) {
  const classes = useStyles();
  return <MuiDialogContentText {...props} className={classes.contentText} />;
}

export function DialogTitle(props: Omit<DialogTitleProps, "className">) {
  const classes = useStyles();
  return <MuiDialogTitle {...props} className={classes.title} />;
}
