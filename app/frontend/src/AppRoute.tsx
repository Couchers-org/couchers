import { Container } from "@material-ui/core";
import classNames from "classnames";
import ErrorBoundary from "components/ErrorBoundary";
import { useEffect } from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";
import makeStyles from "utils/makeStyles";

import Navigation from "./components/Navigation";
import { useAuthContext } from "./features/auth/AuthProvider";
import { jailRoute, loginRoute } from "./routes";

export const useStyles = makeStyles((theme) => ({
  fullscreenContainer: {
    margin: "0 auto",
    padding: 0,
  },
  standardContainer: {
    height: "100%",
    [theme.breakpoints.up("md")]: {
      paddingBottom: 0,
      paddingTop: theme.shape.navPaddingDesktop,
    },
    paddingTop: theme.shape.navPaddingMobile,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  fullWidthContainer: {
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

  const classes = useStyles();

  return isPrivate ? (
    <Route
      {...otherProps}
      render={({ location }) => (
        <>
          {isAuthenticated ? (
            <Container
              className={classNames({
                [classes.standardContainer]:
                  variant === "standard" || variant === "full-width",
                [classes.fullWidthContainer]: variant === "full-width",
              })}
            >
              {isJailed ? (
                <Redirect to={jailRoute} />
              ) : (
                <>
                  <Navigation />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </>
              )}
            </Container>
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
    <>
      {variant === "full-screen" || variant === "full-width" ? (
        <Container
          className={classNames({
            [classes.fullscreenContainer]: variant === "full-screen",
            [classes.fullWidthContainer]: variant === "full-width",
          })}
          maxWidth={false}
        >
          <Route
            {...otherProps}
            render={() => <ErrorBoundary>{children}</ErrorBoundary>}
          />
        </Container>
      ) : (
        <Container className={classes.standardContainer}>
          <Navigation />
          <Route
            {...otherProps}
            render={() => <ErrorBoundary>{children}</ErrorBoundary>}
          />
        </Container>
      )}
    </>
  );
}
