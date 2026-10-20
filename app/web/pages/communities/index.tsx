import { appGetLayout } from "components/AppRoute";
import CommunitiesPage from "features/communities/CommunitiesPage/CommunitiesPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { DEFAULT_LOCALE } from "i18n/locales";
import { COMMUNITIES, DASHBOARD, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await appServerSideTranslations(locale ?? DEFAULT_LOCALE, [GLOBAL, DASHBOARD, COMMUNITIES, NOTIFICATIONS])),
  },
});

export default function CommunitiesRoute() {
  return <CommunitiesPage />;
}

CommunitiesRoute.getLayout = appGetLayout();
