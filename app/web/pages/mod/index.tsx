import { appGetLayout } from "components/AppRoute";
import ModPageComponent from "features/mod/ModPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, MOD, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [PROFILE, GLOBAL, MOD])),
  },
});

export default function ModPage() {
  return <ModPageComponent />;
}

ModPage.getLayout = appGetLayout();
