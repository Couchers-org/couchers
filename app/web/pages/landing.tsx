import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import Landing from "@/features/landing/LandingPage";
import {
  AUTH,
  DASHBOARD,
  GLOBAL,
  LANDING,
  NOTIFICATIONS,
} from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [AUTH, DASHBOARD, GLOBAL, LANDING, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const LandingPage = () => {
  return <Landing />;
};

LandingPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
  bottomMargin: "80px",
});

export default LandingPage;
