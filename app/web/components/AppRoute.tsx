import { Box, Container, GlobalStyles } from "@mui/material";
import { styled } from "@mui/material/styles";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import Footer from "components/Footer";
import { useAuthContext } from "features/auth/AuthProvider";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { jailRoute, loginRoute } from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";
import useIsMobile from "utils/useIsMobile";

import Navigation from "./Navigation";

interface AppRouteProps {
  isPrivate: boolean;
  noFooter?: boolean;
  variant?: "standard" | "full-screen" | "full-width" | "no-overflow";
  bottomMargin?: string;
  children: ReactNode;
}

const globalStyles = (
  <GlobalStyles
    styles={{
      "html, body": {
        margin: 0,
      },
      "#__next": {
        minHeight: "calc(var(--vh, 1vh) * 100)", // Use the dynamic --vh value from _app
        display: "flex",
        flexDirection: "column",
      },
    }}
  />
);

// For no-overflow variant (e.g., map/search pages), we need fixed viewport height
const globalStylesNoOverflow = (
  <GlobalStyles
    styles={{
      "html, body": {
        margin: 0,
        overflow: "hidden",
      },
      "#__next": {
        height: "calc(var(--vh, 1vh) * 100)", // Use the dynamic --vh value from _app
        display: "flex",
        flexDirection: "column",
      },
    }}
  />
);

const PageWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "isNoOverflow" && prop !== "hasBottomNav",
})<{ isNoOverflow?: boolean; hasBottomNav?: boolean }>(
  ({ isNoOverflow, hasBottomNav }) => ({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    ...(isNoOverflow && {
      overflow: "hidden",
      minHeight: 0,
    }),
    ...(hasBottomNav && {
      paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
    }),
  }),
);

const ContentWrapper = styled(
  Container,
  {},
)<{
  variant: AppRouteProps["variant"];
}>(({ theme, variant }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  ...(variant === "no-overflow" && {
    overflow: "hidden",
    minHeight: 0,
  }),
  ...(variant === "standard" && {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  }),
}));

function AppRoute({
  children,
  isPrivate,
  noFooter = false,
  variant = "standard",
  bottomMargin,
}: AppRouteProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { pathname } = router;
  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const isJailed = authState.jailed;
  const isNativeEmbed = useIsNativeEmbed();

  //there must be the same loading state on auth'd pages on server and client
  //for hydration matching, so we will display a loader until mounted.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isAuthenticated && isPrivate) {
      authActions.authError("Please log in.");
      router.push({ pathname: loginRoute, query: { from: location.pathname } });
    }
    if (isAuthenticated && isJailed && isPrivate && pathname !== jailRoute) {
      router.push(jailRoute);
    }
  }, [isAuthenticated, isJailed, isPrivate, authActions, router, pathname]);

  return (
    <ErrorBoundary>
      {isPrivate && (!isMounted || !isAuthenticated) ? (
        <CenteredSpinner minHeight="50vh" />
      ) : (
        <>
          {variant === "no-overflow" ? globalStylesNoOverflow : globalStyles}
          <Navigation />
          {/* Temporary container injected for marketing to test dynamic "announcements".
           * Find a better spot to componentise this code once plan is more finalised with this */}
          <div id="announcements"></div>
          <PageWrapper
            isNoOverflow={variant === "no-overflow"}
            hasBottomNav={isMobile && !isNativeEmbed && isAuthenticated}
          >
            <ContentWrapper
              disableGutters
              variant={variant}
              maxWidth={
                variant === "full-screen" ||
                variant === "full-width" ||
                variant === "no-overflow"
                  ? false
                  : "lg"
              }
            >
              {children}
            </ContentWrapper>
            {!noFooter && (
              <Footer
                bottomMargin={
                  isMobile && !isAuthenticated ? bottomMargin : undefined
                }
              />
            )}
          </PageWrapper>
        </>
      )}
      {!isPrivate && <CookieBanner />}
    </ErrorBoundary>
  );
}

const appGetLayout = ({
  isPrivate = true,
  noFooter = false,
  variant = "standard",
  bottomMargin,
}: Partial<AppRouteProps> = {}) => {
  return function AppLayout(page: ReactNode) {
    return (
      <AppRoute
        isPrivate={isPrivate}
        noFooter={noFooter}
        variant={variant}
        bottomMargin={bottomMargin}
      >
        {page}
      </AppRoute>
    );
  };
};

export { appGetLayout };
