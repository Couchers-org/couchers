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
import NativeColorSchemeSync from "components/NativeColorSchemeSync";
import NativeMobileNavigationHandler from "components/NativeMobileNavigationHandler";
import { AnalyticsProvider } from "features/analytics";
import AuthProvider from "features/auth/AuthProvider";
import ProfileSheet from "features/profile/ProfileSheet";
import { ProfileSheetProvider } from "features/profile/ProfileSheetContext";
import { ReactQueryClientProvider } from "features/reactQueryClient";
import StatsigProvider from "features/statsig/StatsigProvider";
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
    if (process.env.NEXT_PUBLIC_COUCHERS_ENV === "prod") {
      TagManager.initialize({ gtmId: "GTM-PXP3896" });
    }
  }, []);

  /**
   * Mobile viewport workaround (not Next.js related - this is a browser issue).
   * Mobile browsers include the address bar in 100vh, causing layout issues.
   * This sets a CSS variable --vh to the actual visible viewport height.
   * Use `calc(var(--vh, 1vh) * 100)` instead of `100vh` in CSS for consistent behavior.
   * The resetScroll helps recalibrate sticky positioning after keyboard closes. */
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
              <AnalyticsProvider>
                <ReactQueryClientProvider>
                  <AuthProvider>
                    <StatsigProvider>
                      <CssBaseline />
                      <NativeColorSchemeSync />
                      <NativeMobileNavigationHandler />
                      <EnvironmentBanner />
                      <HtmlMeta />
                      <ProfileSheetProvider>
                        {getLayout(<Component {...pageProps} />)}
                        <ProfileSheet />
                      </ProfileSheetProvider>
                    </StatsigProvider>
                  </AuthProvider>
                </ReactQueryClientProvider>
              </AnalyticsProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LocalizationProvider>
      </StyledEngineProvider>
    </AppCacheProvider>
  );
}

export default appWithTranslation(MyApp, nextI18nextConfig);
