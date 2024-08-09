import ErrorFallback from "components/ErrorFallback";
import Sentry, { SentryErrorBoundaryProps } from "platform/sentry";
import React, { PropsWithChildren } from "react";

interface ErrorBoundaryProps
  extends Omit<SentryErrorBoundaryProps, "beforeCapture" | "fallback"> {
  isFatal?: boolean;
}

export default function ErrorBoundary({
  isFatal = false,
  children,
  ...otherProps
}: PropsWithChildren<ErrorBoundaryProps>) {
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
}
