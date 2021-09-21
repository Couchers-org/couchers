import { Container } from "@material-ui/core";
import classNames from "classnames";
import CircularProgress from "components/CircularProgress";
import CookieBanner from "components/CookieBanner";
import ErrorBoundary from "components/ErrorBoundary";
import { Suspense, useEffect, useState } from "react";
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
  },
  fullWidthContainer: {
    margin: "0 auto",
    paddingLeft: 0,
    paddingRight: 0,
  },
  loader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBlockStart: theme.spacing(6),
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

  //react-snap hydration workaround
  const [, setRerender] = useState(false);
  useEffect(() => setRerender(true), []);

  const classes = useAppRouteStyles();

  return isPrivate ? (
    <Route
      {...otherProps}
      render={({ location }) => (
        <>
          {isAuthenticated ? (
            <>
              <>{variant !== "full-screen" && <Navigation />}</>
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
                    : undefined
                }
              >
                {isJailed ? (
                  <Redirect to={jailRoute} />
                ) : (
                  <>
                    <ErrorBoundary>
                      <Suspense
                        fallback={
                          <div className={classes.loader}>
                            <CircularProgress />
                          </div>
                        }
                      >
                        {children}
                      </Suspense>
                    </ErrorBoundary>
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
    <Container
      className={classNames({
        [classes.nonFullScreenStyles]: variant !== "full-screen",
        [classes.fullscreenContainer]: variant === "full-screen",
        [classes.fullWidthContainer]: variant === "full-width",
        [classes.standardContainer]: variant === "standard",
      })}
      maxWidth={variant === "full-screen" ? false : undefined}
    >
      {variant !== "full-screen" && <Navigation />}
      <Route
        {...otherProps}
        render={() => (
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className={classes.loader}>
                  <CircularProgress />
                </div>
              }
            >
              {children}
              <CookieBanner />
            </Suspense>
          </ErrorBoundary>
        )}
      />
    </Container>
  );
}
