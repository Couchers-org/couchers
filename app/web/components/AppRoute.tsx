import { Box, Container, GlobalStyles, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import Footer from "components/Footer";
import { useAuthContext } from "features/auth/AuthProvider";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import { ReactNode, useEffect, useRef, useState } from "react";
import { jailRoute, loginRoute } from "routes";
import { theme } from "theme";

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
        overflow: "hidden", // Prevents whole-page scrolling
      },
      "#__next": {
        height: "calc(var(--vh, 1vh) * 100)", // Use the dynamic --vh value from _app
        display: "flex",
        flexDirection: "column",
      },
    }}
  />
);

const PageWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflowY: "auto",
});

const ContentWrapper = styled(Container, {
  shouldForwardProp: (prop) => prop !== "isNativeEmbed",
})<{
  isNativeEmbed: boolean;
  variant: AppRouteProps["variant"];
}>(({ theme, variant, isNativeEmbed }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  ...(variant === "no-overflow" && {
    overflow: "hidden",
  }),
  ...(variant === "standard" && {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  }),
  ...(isNativeEmbed && {
    margin: "0 auto",
    padding: 0,
  }),
}));

export default function AppRoute({
  children,
  isPrivate,
  noFooter = false,
  variant = "standard",
  bottomMargin,
}: AppRouteProps) {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pageWrapperRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (pageWrapperRef.current) {
      pageWrapperRef.current.scrollTo(0, 0);
    }
  }, [router.asPath]); // scroll to top on route change

  return (
    <ErrorBoundary>
      {isPrivate && (!isMounted || !isAuthenticated) ? (
        <CenteredSpinner minHeight="50vh" />
      ) : (
        <>
          {globalStyles}
          {!isNativeEmbed && <Navigation />}
          {/* Temporary container injected for marketing to test dynamic "announcements".
           * Find a better spot to componentise this code once plan is more finalised with this */}
          <div id="announcements"></div>
          <PageWrapper ref={pageWrapperRef}>
            <ContentWrapper
              disableGutters
              isNativeEmbed={isNativeEmbed}
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
              <Footer bottomMargin={isMobile ? bottomMargin : undefined} />
            )}
          </PageWrapper>
        </>
      )}
      {!isPrivate && !isNativeEmbed && <CookieBanner />}
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
