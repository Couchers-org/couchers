import ErrorFallback from "components/ErrorFallback";
import React, { PropsWithChildren } from "react";
import {
  ErrorBoundary as ReactErrorBoundary,
  ErrorBoundaryPropsWithComponent,
} from "react-error-boundary";
import { useLocation } from "react-router";

interface ErrorBoundaryProps
  extends Omit<ErrorBoundaryPropsWithComponent, "FallbackComponent"> {
  isFatal?: boolean;
}

export default function ErrorBoundary({
  isFatal = false,
  children,
  ...otherProps
}: PropsWithChildren<ErrorBoundaryProps>) {
  const { pathname } = useLocation();

  return (
    <ReactErrorBoundary
      resetKeys={[pathname || "home"]}
      FallbackComponent={() => <ErrorFallback isFatal={isFatal} />}
      {...otherProps}
    >
      {children}
    </ReactErrorBoundary>
  );
}
