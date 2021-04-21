import ErrorFallback from "components/ErrorFallback";
import { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router";

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <ReactErrorBoundary
      resetKeys={[pathname || "home"]}
      FallbackComponent={() => <ErrorFallback />}
    >
      {children}
    </ReactErrorBoundary>
  );
}
