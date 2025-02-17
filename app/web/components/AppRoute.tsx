import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import Footer from "components/Footer";
import { useAuthContext } from "features/auth/AuthProvider";
import { useRouter } from "next/router";
import { useIsNativeEmbed } from "platform/nativeLink";
import { ReactNode, useEffect, useState } from "react";
import { jailRoute, loginRoute } from "routes";
import { theme } from "theme";

import Navigation from "./Navigation";

interface AppRouteProps {
  isPrivate: boolean;
  noFooter?: boolean;
  variant?: "standard" | "full-screen" | "full-width";
  children: ReactNode;
}

const ContentWrapper = styled("div")<{ variant: AppRouteProps["variant"] }>(
  ({ theme, variant }) => ({
    ...(variant === "standard" && {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      flex: 1,
    }),
    ...(variant === "full-width" && {
      margin: "0 auto",
      paddingLeft: 0,
      paddingRight: 0,
    }),
  }),
);

export default function AppRoute({
  children,
  isPrivate,
  noFooter = false,
  variant = "standard",
}: AppRouteProps) {
  const router = useRouter();
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
    if (isAuthenticated && isJailed && router.pathname !== jailRoute) {
      router.push(jailRoute);
    }
  }, [isAuthenticated, isJailed, isPrivate, authActions, router]);

  const containerSx = {
    position: "fixed",
    top: theme.shape.navPaddingXs,
    bottom: 0,
    overflowY: "auto",

    [theme.breakpoints.up("sm")]: {
      top: theme.shape.navPaddingSmUp,
    },
    ...(isNativeEmbed && {
      margin: "0 auto",
      padding: 0,
    }),
  };

  return (
    <ErrorBoundary>
      {isPrivate && (!isMounted || !isAuthenticated) ? (
        <CenteredSpinner minHeight="50vh" />
      ) : (
        <>
          {!isNativeEmbed && <Navigation />}
          {/* Temporary container injected for marketing to test dynamic "announcements".
           * Find a better spot to componentise this code once plan is more finalised with this */}
          <div id="announcements"></div>
          <Container
            disableGutters
            sx={containerSx}
            maxWidth={
              variant === "full-screen" || variant === "full-width"
                ? false
                : "lg"
            }
          >
            <ContentWrapper variant={variant}> {children}</ContentWrapper>
            {!noFooter && !isNativeEmbed && <Footer />}
          </Container>
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
}: Partial<AppRouteProps> = {}) => {
  return function AppLayout(page: ReactNode) {
    return (
      <AppRoute isPrivate={isPrivate} noFooter={noFooter} variant={variant}>
        {page}
      </AppRoute>
    );
  };
};

export { appGetLayout };
