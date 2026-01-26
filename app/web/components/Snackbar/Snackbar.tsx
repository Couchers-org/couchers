import { Alert as MuiAlert, Snackbar as MuiSnackbar } from "@mui/material";
import { ReactNode, useState } from "react";

import { grpcErrorStrings, ObscureGrpcErrorMessages } from "../../appConstants";

interface SnackbarProps {
  children: ReactNode;
  onClose?: () => void;
  severity: "success" | "error";
}

export default function Snackbar({
  children,
  onClose = () => {},
  severity,
}: SnackbarProps) {
  const [open, setOpen] = useState(true);

  const oldErrorKey =
    typeof children === "string"
      ? Object.keys(grpcErrorStrings).find<ObscureGrpcErrorMessages>(
          (oldError): oldError is ObscureGrpcErrorMessages =>
            children.includes(oldError),
        )
      : null;

  return (
    <MuiSnackbar
      autoHideDuration={8000}
      open={open}
      onClose={() => {
        setOpen(false);
        onClose();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      // Prevent snackbar from blocking touch interactions on mobile WebViews
      disableWindowBlurListener
      slotProps={{
        clickAwayListener: {
          mouseEvent: false,
          touchEvent: false,
        },
      }}
      sx={{ pointerEvents: "none" }}
    >
      <MuiAlert severity={severity} sx={{ pointerEvents: "auto" }}>
        {
          // Search for the error in the ugly grpc error object keys
          // Replace it with the nice error if found
          oldErrorKey ? grpcErrorStrings[oldErrorKey] : children
        }
      </MuiAlert>
    </MuiSnackbar>
  );
}
