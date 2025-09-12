import React, { PropsWithChildren } from "react";

import ErrorFallback from "@/components/ErrorFallback";
import { Sentry, SentryErrorBoundaryProps } from "@/platform/sentry";

interface ErrorBoundaryProps
  extends Omit<SentryErrorBoundaryProps, "beforeCapture" | "fallback"> {
  isFatal?: boolean;
}

const ErrorBoundary = ({
  isFatal = false,
  children,
  ...otherProps
}: PropsWithChildren<ErrorBoundaryProps>) => {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag("isFatal", isFatal);
      }}
      fallback={<ErrorFallback isFatal={isFatal} />}
      {...otherProps}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default ErrorBoundary;
