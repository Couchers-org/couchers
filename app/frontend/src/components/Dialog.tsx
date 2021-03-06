import {
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogActionsProps,
  DialogContent as MuiDialogContent,
  DialogContentProps,
  DialogContentText as MuiDialogContentText,
  DialogContentTextProps,
  DialogProps,
  DialogTitle as MuiDialogTitle,
  DialogTitleProps,
  makeStyles,
} from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  actions: {
    display: "flex",
    justifyContent: "space-around",
    margin: 0,
    padding: theme.spacing(2),
    paddingTop: 0,
  },
  content: {
    padding: theme.spacing(2),
  },
  contentText: {
    padding: theme.spacing(2),
  },
  dialog: {
    padding: 0,
  },
  title: {
    "& > h2": theme.typography.h2,
    "&:not(:nth-child(1))": {
      paddingTop: 0,
    },
    padding: theme.spacing(2),
    paddingBottom: 0,
    textAlign: "center",
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
