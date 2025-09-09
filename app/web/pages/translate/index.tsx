import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import TranslationPage from "@/features/translate/TranslationPage";
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

const TranslationPageComponent = () => {
  return <TranslationPage />;
};

TranslationPageComponent.getLayout = appGetLayout({ isPrivate: false });

export default TranslationPageComponent;
