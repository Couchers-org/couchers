import "intersection-observer";
import "fonts";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import HtmlMeta from "components/HtmlMeta";
import AuthProvider from "features/auth/AuthProvider";
import { ReactQueryClientProvider } from "features/reactQueryClient";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import nextI18nextConfig from "next-i18next.config";
import Sentry from "platform/sentry";
import { ReactNode, useEffect } from "react";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";
import { theme } from "theme";

type AppWithLayoutProps = Omit<AppProps, "Component"> & {
  Component: AppProps["Component"] & {
    getLayout: (page: ReactNode) => ReactNode;
  };
};

function MyApp({ Component, pageProps }: AppWithLayoutProps) {
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
      Sentry.init({
        dsn: "https://5594adb1a53e41bfbb9f2cc5c91e2dbd@o782870.ingest.sentry.io/5887585",
        environment: process.env.NEXT_PUBLIC_COUCHERS_ENV,
        release: process.env.NEXT_PUBLIC_VERSION,
      });
      TagManager.initialize({ gtmId: "GTM-PXP3896" });
    }
  }, []);

  return (
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
  );
}

export default appWithTranslation(MyApp, nextI18nextConfig);
