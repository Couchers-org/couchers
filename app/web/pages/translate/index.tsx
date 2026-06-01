import { appGetLayout } from "components/AppRoute";
import TranslationPage from "features/translate/TranslationPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? "en", [
      GLOBAL,
      NOTIFICATIONS,
    ])),
  },
});

export default function TranslationPageComponent() {
  return <TranslationPage />;
}

TranslationPageComponent.getLayout = appGetLayout({ isPrivate: false });
