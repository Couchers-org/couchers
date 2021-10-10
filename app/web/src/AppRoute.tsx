import { Container, useTheme } from "@material-ui/core";
import classNames from "classnames";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import Footer from "components/Footer";
import { useEffect } from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import Navigation from "./components/Navigation";
import { useAuthContext } from "./features/auth/AuthProvider";
import { jailRoute, loginRoute } from "./routes";

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
  },
  fullWidthContainer: {
    margin: "0 auto",
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

interface AppRouteProps extends RouteProps {
  isPrivate: boolean;
  variant?: "standard" | "full-screen" | "full-width";
}

export default function AppRoute({
  children,
  isPrivate,
  variant = "standard",
  ...otherProps
}: AppRouteProps) {
  const { authState, authActions } = useAuthContext();
  const isAuthenticated = authState.authenticated;
  const isJailed = authState.jailed;
  useEffect(() => {
    if (!isAuthenticated && isPrivate) {
      authActions.authError("Please log in.");
    }
  });

  const classes = useAppRouteStyles();
  const theme = useTheme();

  return (
    <>
      {isPrivate ? (
        <Route
          {...otherProps}
          render={({ location }) => (
            <>
              {isAuthenticated ? (
                <>
                  {variant !== "full-screen" && <Navigation />}
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
                    {isJailed ? (
                      <Redirect to={jailRoute} />
                    ) : (
                      <>
                        <ErrorBoundary>{children}</ErrorBoundary>
                      </>
                    )}
                  </Container>
                </>
              ) : (
                <Redirect
                  to={{
                    pathname: loginRoute,
                    state: { from: location },
                  }}
                />
              )}
            </>
          )}
        />
      ) : (
        <Route
          {...otherProps}
          render={() => (
            <>
              {variant !== "full-screen" && <Navigation />}
              <Container
                className={classNames({
                  [classes.nonFullScreenStyles]: variant !== "full-screen",
                  [classes.fullscreenContainer]: variant === "full-screen",
                  [classes.fullWidthContainer]: variant === "full-width",
                  [classes.standardContainer]: variant === "standard",
                })}
                maxWidth={
                  variant === "full-screen" || variant === "full-width"
                    ? false
                    : "lg"
                }
              >
                <ErrorBoundary>
                  {children}
                  <CookieBanner />
                </ErrorBoundary>
              </Container>
            </>
          )}
        />
      )}
      {variant !== "full-screen" && (
        <Footer
          maxWidth={
            //1280px is from Container variant lg
            variant === "full-width" ? "100%" : "1280px"
          }
          paddingInline={variant === "full-width" ? "0" : theme.spacing(2)}
        />
      )}
    </>
  );
}
