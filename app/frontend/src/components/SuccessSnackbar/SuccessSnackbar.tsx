import { Snackbar as MuiSnackbar } from "@material-ui/core";
import Alert from "components/Alert";
import { useState } from "react";

export interface SuccessSnackbarProps {
  children: string;
}

export default function SuccessSnackbar({ children }: SuccessSnackbarProps) {
  const [open, setOpen] = useState(true);
  return (
    <MuiSnackbar
      autoHideDuration={6000}
      open={open}
      onClose={() => setOpen(false)}
    >
      <Alert severity="success">{children}</Alert>
    </MuiSnackbar>
  );
}
