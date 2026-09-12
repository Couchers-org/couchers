import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, NOTIFICATIONS])),
    },
  };
};

export default function Custom404() {
  return <NotFoundPage />;
}

Custom404.getLayout = appGetLayout({
  isPrivate: false,
});
