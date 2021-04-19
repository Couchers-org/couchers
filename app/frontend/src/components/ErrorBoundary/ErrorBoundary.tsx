import ErrorFallback from "components/ErrorFallback";
import { PropsWithChildren, useCallback } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

export default function ErrorBoundary({
  children,
}: PropsWithChildren<unknown>) {
  const onError = useCallback(() => {
    // TODO: log error to backend?
  }, []);

  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onError={onError}>
      {children}
    </ReactErrorBoundary>
  );
}
