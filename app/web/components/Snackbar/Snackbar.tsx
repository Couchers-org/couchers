import { Alert as MuiAlert, Snackbar as MuiSnackbar } from "@mui/material";
import { ReactNode, useState } from "react";

import { ObscureGrpcErrorMessages, grpcErrorStrings } from "@/appConstants";
import { emptyFunction } from "@/utils/function";

export interface SnackbarProps {
  children: ReactNode;
  onClose?: () => void;
  severity: "success" | "error";
}

const Snackbar = ({
  children,
  onClose = emptyFunction,
  severity,
}: SnackbarProps) => {
  const [isOpen, setIsOpen] = useState(true);

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
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
        onClose();
      }}
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
};

export default Snackbar;
