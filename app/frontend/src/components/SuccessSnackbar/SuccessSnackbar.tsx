import { Snackbar as MuiSnackbar } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import { ReactNode, useState } from "react";

export interface SuccessSnackbarProps {
  children: ReactNode;
}

export default function SuccessSnackbar({ children }: SuccessSnackbarProps) {
  const [open, setOpen] = useState(true);
  return (
    <MuiSnackbar
      autoHideDuration={8000}
      open={open}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MuiAlert severity="success">{children}</MuiAlert>
    </MuiSnackbar>
  );
}
