import { appGetLayout } from "components/AppRoute";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import LandingPage from "../features/landing/LandingPage";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "dashboard", "landing", "auth"],
      nextI18nextConfig
    )),
  },
});

export default function HomePage() {
  return <LandingPage />;
}

HomePage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});
