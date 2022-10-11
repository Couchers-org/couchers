import { Container } from "@material-ui/core";
import classNames from "classnames";
import CircularProgress from "components/CircularProgress";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import Footer from "components/Footer";
import { useAuthContext } from "features/auth/AuthProvider";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { jailRoute, loginRoute } from "routes";
import makeStyles from "utils/makeStyles";

import Navigation from "./Navigation";

export const useAppRouteStyles = makeStyles((theme) => ({
  fullscreenContainer: {
    margin: "0 auto",
    padding: 0,
  },
  nonFullScreenStyles: {
    height: "100%",
  },
  standardContainer: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    flex: 1,
  },
  fullWidthContainer: {
    margin: "0 auto",
    paddingLeft: 0,
    paddingRight: 0,
  },
  loader: {
    //minimal-effort reduction of layout shifting
    minHeight: "50vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: theme.spacing(6),
  },
  "@global html": {
    scrollPaddingTop: `calc(${theme.shape.navPaddingXs} + ${theme.spacing(2)})`,
    height: "100%",
  },
  [theme.breakpoints.up("sm")]: {
    "@global html": {
      scrollPaddingTop: `calc(${theme.shape.navPaddingSmUp} + ${theme.spacing(
        2
      )})`,
    },
  },
  "@global body": {
    height: "100%",
  },
  "@global #__next": {
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
  const classes = useAppRouteStyles();
  const router = useRouter();
  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const isJailed = authState.jailed;

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
  });

  return (
    <ErrorBoundary>
      {isPrivate && (!isMounted || !isAuthenticated) ? (
        <div className={classes.loader}>
          <CircularProgress />
        </div>
      ) : (
        <>
          <Navigation />
          {/* Temporary container injected for marketing to test dynamic "announcements".
           * Find a better spot to componentise this code once plan is more finalised with this */}
          <div id="announcements"></div>
          <Container
            className={classNames({
              [classes.nonFullScreenStyles]: variant !== "full-screen",
              [classes.fullWidthContainer]: variant === "full-width",
              [classes.fullscreenContainer]: variant === "full-screen",
              [classes.standardContainer]: variant === "standard",
            })}
            maxWidth={
              variant === "full-screen" || variant === "full-width"
                ? false
                : "lg"
            }
          >
            {/* Have to wrap this in a fragment because of https://github.com/mui-org/material-ui/issues/21711 */}
            <>{children}</>
          </Container>
          {!noFooter && <Footer />}
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
