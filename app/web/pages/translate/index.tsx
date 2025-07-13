import { appGetLayout } from "components/AppRoute";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import TranslationPage from "features/translate/TranslationPage";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, NOTIFICATIONS],
      nextI18nextConfig,
    )),
  },
});

export default function TranslationPageComponent() {
  return <TranslationPage />;
}

TranslationPageComponent.getLayout = appGetLayout({ isPrivate: false });
