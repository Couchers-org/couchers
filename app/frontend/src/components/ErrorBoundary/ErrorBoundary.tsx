import ErrorFallback from "components/ErrorFallback";
import { PropsWithChildren } from "react";
import {
  ErrorBoundary as ReactErrorBoundary,
  ErrorBoundaryProps,
} from "react-error-boundary";
import { useLocation } from "react-router";

export default function ErrorBoundary({
  children,
  ...otherProps
}: PropsWithChildren<Partial<ErrorBoundaryProps>>) {
  const { pathname } = useLocation();

  return (
    <ReactErrorBoundary
      resetKeys={[pathname || "home"]}
      FallbackComponent={() => <ErrorFallback />}
      {...otherProps}
    >
      {children}
    </ReactErrorBoundary>
  );
}
