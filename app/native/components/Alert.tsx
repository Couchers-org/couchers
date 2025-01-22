import { grpcErrorStrings, ObscureGrpcErrorMessages } from "appConstants";
import React from "react";
import { ThemedText } from "@/components/ThemedText";

interface AlertProps {
  children: string;
}

export default function Alert({ children }: AlertProps) {
  const oldErrorKey = Object.keys(grpcErrorStrings).find(
    (oldError): oldError is ObscureGrpcErrorMessages =>
      children.includes(oldError),
  );

  return (
    <ThemedText type="error">
      {
        // Search for the error in the ugly grpc error object keys
        // Replace it with the nice error if found
        oldErrorKey ? grpcErrorStrings[oldErrorKey] : children
      }
    </ThemedText>
  );
}
