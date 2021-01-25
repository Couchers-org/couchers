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

export function Dialog(props: Omit<DialogProps, "className">) {
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
