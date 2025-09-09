import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import TOS from "@/components/TOS";
import { GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

const TOSPage = () => {
  return <TOS />;
};

TOSPage.getLayout = appGetLayout({
  isPrivate: false,
  variant: "full-screen",
});

export default TOSPage;
