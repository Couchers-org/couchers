import { Snackbar as MuiSnackbar } from "@material-ui/core";
import { Alert as MuiAlert } from "@material-ui/lab/";
import { ReactNode, useState } from "react";

import { grpcErrorStrings, ObscureGrpcErrorMessages } from "../../constants";

export interface SnackbarProps {
  children: ReactNode;
  severity: "success" | "error";
}

export default function Snackbar({ children, severity }: SnackbarProps) {
  const [open, setOpen] = useState(true);

  const oldErrorKey =
    typeof children === "string"
      ? Object.keys(grpcErrorStrings).find<ObscureGrpcErrorMessages>(
          (oldError): oldError is ObscureGrpcErrorMessages =>
            children.includes(oldError)
        )
      : null;

  return (
    <MuiSnackbar
      autoHideDuration={8000}
      open={open}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MuiAlert severity={severity}>
        {
          // Search for the error in the ugly grpc error object keys
          // Replace it with the nice error if found
          oldErrorKey ? grpcErrorStrings[oldErrorKey] : children
        }
      </MuiAlert>
    </MuiSnackbar>
  );
}
