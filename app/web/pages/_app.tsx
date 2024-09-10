import "intersection-observer";
import "fonts";

import { CssBaseline, ThemeProvider } from "@material-ui/core";
import { EnvironmentBanner } from "components/EnvironmentBanner";
import ErrorBoundary from "components/ErrorBoundary";
import HtmlMeta from "components/HtmlMeta";
import AuthProvider from "features/auth/AuthProvider";
import { NotificationProvider } from "features/auth/notifications/NotificationContext";
import { ReactQueryClientProvider } from "features/reactQueryClient";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import nextI18nextConfig from "next-i18next.config";
import Sentry from "platform/sentry";
import { ReactNode, useEffect } from "react";
import TagManager from "react-gtm-module";
import { polyfill } from "seamless-scroll-polyfill";
import { registerPushNotification } from "service/notifications";
import { theme } from "theme";
import { arrayBufferToBase64 } from "utils/arrayBufferToBase64";

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

  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          { scope: "/" }
        );
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
        const existingPushSubscription =
          await registration.pushManager.getSubscription();
        const p256dhKey = existingPushSubscription?.getKey("p256dh");

        if (existingPushSubscription && p256dhKey) {
          const publicKey = arrayBufferToBase64(p256dhKey);
          if (publicKey !== process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            await existingPushSubscription.unsubscribe();
          } else {
            return;
          }
        }

        const subscription: PushSubscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

        await registerPushNotification(subscription);
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    };

    const requestNotificationPermission = async () => {
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("Notification permission granted.");
          } else {
            console.log("Notification permission denied.");
          }
        } catch (error) {
          console.log("Error requesting notification permission:", error);
        }
      }
    };

    if ("serviceWorker" in navigator) {
      const handleLoad = () => registerServiceWorker();
      window.addEventListener("load", handleLoad);

      // Cleanup listener when component unmounts
      return () => window.removeEventListener("load", handleLoad);
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      requestNotificationPermission();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary isFatal>
        <ReactQueryClientProvider>
          <AuthProvider>
            <NotificationProvider>
              <CssBaseline />
              <EnvironmentBanner />
              <HtmlMeta />
              {getLayout(<Component {...pageProps} />)}
            </NotificationProvider>
          </AuthProvider>
        </ReactQueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default appWithTranslation(MyApp, nextI18nextConfig);
