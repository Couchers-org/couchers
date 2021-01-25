import Button from "../../../components/Button";
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  DialogContent,
} from "../../../components/Dialog";
import { DialogProps } from "@material-ui/core";

export default function MembersDialog(props: DialogProps) {
  return (
    <Dialog {...props} aria-labelledby="chat-dialog-title">
      <DialogTitle id="chat-dialog-title">Chat Members</DialogTitle>
      <DialogContent>
        <DialogContentText>Text</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button>Action 1</Button>
        <Button>Action 2</Button>
      </DialogActions>
    </Dialog>
  );
}
