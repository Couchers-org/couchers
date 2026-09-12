import { appGetLayout } from "components/AppRoute";
import BadgesPageComponent from "features/badges/BadgesPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { GLOBAL, NOTIFICATIONS, PROFILE } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [PROFILE, GLOBAL, NOTIFICATIONS])),
  },
});

export default function BadgesPage() {
  return <BadgesPageComponent />;
}

BadgesPage.getLayout = appGetLayout();
