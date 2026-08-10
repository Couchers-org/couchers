import { Alert as MuiAlert, AlertProps as MuiAlertProps, styled } from "@mui/material";
import { grpcErrorStrings, ObscureGrpcErrorMessages } from "appConstants";
import React, { ReactNode } from "react";

const StyledAlert = styled(MuiAlert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

interface AlertProps extends MuiAlertProps {
  severity: MuiAlertProps["severity"];
  children: string | ReactNode;
}

export default function Alert({ className, children, ...otherProps }: AlertProps) {
  const oldErrorKey = Object.keys(grpcErrorStrings).find(
    (oldError): oldError is ObscureGrpcErrorMessages => typeof children === "string" && children.includes(oldError),
  );

  return (
    <StyledAlert {...otherProps} className={className}>
      {
        // Search for the error in the ugly grpc error object keys
        // Replace it with the nice error if found
        oldErrorKey ? grpcErrorStrings[oldErrorKey] : children
      }
    </StyledAlert>
  );
}
