import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "intersection-observer";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import React, { ReactNode, useEffect } from "react";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";

import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import HtmlMeta from "@/components/HtmlMeta";
import AuthProvider from "@/features/auth/AuthProvider";
import { ReactQueryClientProvider } from "@/features/reactQueryClient";
import nextI18nextConfig from "@/next-i18next.config";
import { theme } from "@/theme";

import "./main.css";

type AppWithLayoutProps = Omit<AppProps, "Component"> & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: AppProps["Component"] & {
    getLayout: (page: ReactNode) => ReactNode;
  };
};

/* eslint-disable @typescript-eslint/naming-convention */
const MyApp = ({ Component, pageProps }: AppWithLayoutProps) => {
  const getLayout = Component.getLayout;

  useEffect(() => {
    polyfill();
  }, []);
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles && jssStyles.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);
  /* eslint-enable @typescript-eslint/naming-convention */

  useEffect(() => {
    if (Config.couchersEnv === "prod") {
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
  );
};

export default appWithTranslation(MyApp, nextI18nextConfig);
