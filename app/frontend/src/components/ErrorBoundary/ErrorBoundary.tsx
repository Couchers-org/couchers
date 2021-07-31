import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react";
import ErrorFallback from "components/ErrorFallback";
import { PropsWithChildren } from "react";
import { useLocation } from "react-router";

interface ErrorBoundaryProps
  extends Omit<SentryErrorBoundaryProps, "fallback"> {
  isFatal?: boolean;
}

export default function ErrorBoundary({
  isFatal = false,
  children,
  ...otherProps
}: PropsWithChildren<ErrorBoundaryProps>) {
  const { pathname } = useLocation();

  return (
    <SentryErrorBoundary
      resetKeys={[pathname || "home"]}
      fallback={() => <ErrorFallback isFatal={isFatal} />}
      {...otherProps}
    >
      {children}
    </SentryErrorBoundary>
  );
}
