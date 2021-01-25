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

export default function InviteDialog(props: DialogProps) {
  return (
    <Dialog {...props} aria-labelledby="invite-dialog-title">
      <DialogTitle id="invite-dialog-title">Invite to chat</DialogTitle>
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
