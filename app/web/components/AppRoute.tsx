import { Container, useTheme } from "@material-ui/core";
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
  const theme = useTheme();
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
    if (isAuthenticated && isJailed) {
      router.push(jailRoute);
    }
  });

  return (
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
          variant === "full-screen" || variant === "full-width" ? false : "lg"
        }
      >
        <ErrorBoundary>
          {!isMounted && isPrivate ? (
            <div className={classes.loader}>
              <CircularProgress />
            </div>
          ) : (
            children
          )}
          {!isPrivate && <CookieBanner />}
        </ErrorBoundary>
      </Container>
      {!noFooter && (
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
