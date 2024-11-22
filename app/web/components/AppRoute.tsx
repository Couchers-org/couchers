import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";
import CircularProgress from "components/CircularProgress";
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

const StyledLoader = styled("div")(({ theme }) => ({
  minHeight: "50vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBlockStart: theme.spacing(6),
}));

const GlobalStyles = styled("div")(({ theme }) => ({
  html: {
    scrollPaddingTop: `calc(${theme.shape.navPaddingXs} + ${theme.spacing(2)})`,
    height: "100%",

    [theme.breakpoints.up("sm")]: {
      scrollPaddingTop: `calc(${theme.shape.navPaddingSmUp} + ${theme.spacing(
        2
      )})`,
    },
  },
  body: {
    height: "100%",
  },
  "#__next": {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
}));

interface AppRouteProps {
  isPrivate: boolean;
  noFooter?: boolean;
  variant?: "standard" | "full-screen" | "full-width";
  children: ReactNode;
}

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
    ...(variant !== "full-screen" && { height: "100%" }),
    ...(variant === "standard" && {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      flex: 1,
    }),
    ...(variant === "full-width" && {
      margin: "0 auto",
      paddingLeft: 0,
      paddingRight: 0,
    }),
    ...(isNativeEmbed && {
      margin: "0 auto",
      padding: 0,
    }),
  };

  return (
    <ErrorBoundary>
      {isPrivate && (!isMounted || !isAuthenticated) ? (
        <StyledLoader>
          <CircularProgress />
        </StyledLoader>
      ) : (
        <>
          <GlobalStyles />
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
            {children}
          </Container>
          {!noFooter && !isNativeEmbed && <Footer />}
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
