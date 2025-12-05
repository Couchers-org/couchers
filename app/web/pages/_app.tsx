import "intersection-observer";
import "./main.css";

import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import { AppCacheProvider } from "@mui/material-nextjs/v15-pagesRouter";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import HtmlMeta from "components/HtmlMeta";
import AuthProvider from "features/auth/AuthProvider";
import { ReactQueryClientProvider } from "features/reactQueryClient";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import nextI18nextConfig from "next-i18next.config";
import React, { ReactNode, useEffect } from "react";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";
import { theme } from "theme";

type AppWithLayoutProps = Omit<AppProps, "Component"> & {
  Component: AppProps["Component"] & {
    getLayout: (page: ReactNode) => ReactNode;
  };
};

function MyApp(props: AppWithLayoutProps) {
  const { Component, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page: ReactNode) => page);
  useEffect(() => polyfill(), []);
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement!.removeChild(jssStyles);
    }
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_COUCHERS_ENV === "prod") {
      TagManager.initialize({ gtmId: "GTM-PXP3896" });
    }
  }, []);

  /** @TODO(NA) Workaround likely due to old version of Next.js.
   * Mobile browser is handling 100vh inconsistently, causing layout shift that
   * 1. Breaks sticky positioning.
   * 2. Doesn't resize after mobile keyboard retracts.
   * Replace 100vh with a custom CSS variable to handle dynamic viewport changes and force scroll reset.
   * TL;DR The sticky positioning of the send bar was not being recognized on first load on mobile. */
  useEffect(() => {
    const updateVH = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`,
      );
    };

    const resetScroll = () => {
      // Scroll the page by a tiny amount to trigger recalibration
      window.scrollTo(0, window.scrollY + 1);
      window.scrollTo(0, window.scrollY - 1);
    };

    updateVH();
    window.addEventListener("resize", updateVH);
    window.addEventListener("focusout", resetScroll);

    return () => {
      window.removeEventListener("resize", updateVH);
      window.removeEventListener("focusout", resetScroll);
    };
  }, []);

  return (
    <AppCacheProvider {...props}>
      <StyledEngineProvider injectFirst>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeProvider theme={theme}>
            <ErrorBoundary isFatal>
              <ReactQueryClientProvider>
                <AuthProvider>
                  <CssBaseline />
                  <EnvironmentBanner />
                  <HtmlMeta />
                  {getLayout(<Component {...pageProps} />)}
                </AuthProvider>
              </ReactQueryClientProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LocalizationProvider>
      </StyledEngineProvider>
    </AppCacheProvider>
  );
}

export default appWithTranslation(MyApp, nextI18nextConfig);
